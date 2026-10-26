"""Applying to an internship scores the student's resume against the posting."""

import json
from datetime import datetime, timedelta

import pytest

from app.models.application import Application
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole

API = "/api/internship"


@pytest.fixture
def company_headers(seeded, auth_headers):
    return auth_headers(seeded.company)


@pytest.fixture
def asha_headers(seeded, auth_headers):
    return auth_headers(seeded.students["asha"])


def test_student_applies_with_their_active_resume(client, seeded, asha_headers, db_session):
    response = client.post(f"{API}/{seeded.backend.id}/apply", data={"cover_letter": "Hi"}, headers=asha_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["resume_id"] == seeded.resumes["asha"].id
    assert body["used_tailored_resume"] == 0
    assert body["match_score"] > 50
    application = db_session.query(Application).one()
    assert application.cover_letter == "Hi"

    mine = client.get(f"{API}/applications/my-applications", headers=asha_headers).json()
    assert [a["internship_id"] for a in mine] == [seeded.backend.id]
    assert client.get(f"{API}/match", headers=asha_headers).json()[0]["has_applied"] is True


def test_my_applications_names_the_internship_and_company_newest_first(client, seeded, asha_headers, db_session):
    client.post(f"{API}/{seeded.backend.id}/apply", headers=asha_headers)
    client.post(f"{API}/{seeded.frontend.id}/apply", headers=asha_headers)
    first, second = db_session.query(Application).order_by(Application.id).all()
    first.created_at = datetime(2026, 1, 1)
    second.created_at = datetime(2026, 1, 1) + timedelta(days=1)
    seeded.backend.location = "Chennai"
    seeded.frontend.is_active = 0
    db_session.commit()

    mine = client.get(f"{API}/applications/my-applications", headers=asha_headers).json()

    assert [(a["internship_title"], a["company_name"], a["internship_is_active"]) for a in mine] == [
        ("Frontend Intern", "Acme Labs", False),
        ("Backend Intern", "Acme Labs", True),
    ]
    assert mine[1]["internship_location"] == "Chennai"
    assert mine[0]["status"] == "pending"


def test_applying_twice_is_rejected(client, seeded, asha_headers):
    client.post(f"{API}/{seeded.backend.id}/apply", headers=asha_headers)
    response = client.post(f"{API}/{seeded.backend.id}/apply", headers=asha_headers)
    assert response.status_code == 400


def test_missing_embedding_falls_back_to_the_precomputed_score(client, seeded, asha_headers, fake_rag, db_session):
    fake_rag.delete_resume_embedding(str(seeded.resumes["asha"].id))
    db_session.add(
        StudentInternshipMatch(
            student_id=seeded.students["asha"].id, internship_id=seeded.backend.id, base_similarity_score=77.4
        )
    )
    db_session.commit()

    response = client.post(f"{API}/{seeded.backend.id}/apply", headers=asha_headers)

    assert response.status_code == 201
    assert response.json()["application_similarity_score"] == 0
    assert response.json()["match_score"] == 77


def test_apply_with_a_tailored_resume(client, seeded, asha_headers, fake_gemini, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    fake_gemini.reply(json.dumps({"skills": {"technical": ["Python", "FastAPI", "Docker"], "soft": []}}))

    response = client.post(
        f"{API}/{seeded.backend.id}/apply",
        data={"use_tailored_resume": "true"},
        files={"tailored_resume": ("tailored.txt", b"Python FastAPI Docker backend services", "text/plain")},
        headers=asha_headers,
    )

    assert response.status_code == 201
    assert response.json()["used_tailored_resume"] == 1
    assert response.json()["resume_id"] != seeded.resumes["asha"].id


def test_apply_rules(client, seeded, company_headers, make_user, auth_headers):
    assert client.post(f"{API}/{seeded.backend.id}/apply", headers=company_headers).status_code == 403
    no_resume = auth_headers(make_user(role=UserRole.student))
    assert client.post(f"{API}/{seeded.backend.id}/apply", headers=no_resume).status_code == 404
    assert client.post(f"{API}/999999/apply", headers=no_resume).status_code == 404
    assert client.get(f"{API}/applications/my-applications", headers=company_headers).status_code == 403
