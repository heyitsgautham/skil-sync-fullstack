"""Internship routes: posting, listing, matching, editing, applying."""

import json
from datetime import UTC, datetime

import pytest

from app.models.internship import Internship
from app.models.user import UserRole
from app.services import internship_document_parser, job_description_analyzer

API = "/api/internship"
JD = "We need a backend intern who writes Python and FastAPI services and has used Docker before."


@pytest.fixture
def company_headers(seeded, auth_headers):
    return auth_headers(seeded.company)


@pytest.fixture
def asha_headers(seeded, auth_headers):
    return auth_headers(seeded.students["asha"])


# -- posting and reading ------------------------------------------------------


def test_company_posts_an_internship_and_it_is_embedded(client, company_headers, fake_rag, db_session):
    body = {"title": "ML Intern", "description": "Train models in Python", "required_skills": ["Python"]}

    response = client.post(f"{API}/post", json=body, headers=company_headers)

    assert response.status_code == 201
    new_id = response.json()["id"]
    assert response.json()["preferred_skills"] == []
    assert fake_rag.get_internship_embedding(str(new_id)) is not None
    assert db_session.query(Internship).count() == 3


def test_students_cannot_post(client, asha_headers):
    response = client.post(f"{API}/post", json={"title": "x", "description": "y"}, headers=asha_headers)
    assert response.status_code == 403


def test_list_get_and_my_posts(client, seeded, company_headers, asha_headers):
    listed = client.get(f"{API}/list").json()
    assert {item["title"] for item in listed} == {"Backend Intern", "Frontend Intern"}

    detail = client.get(f"{API}/{seeded.backend.id}", headers=asha_headers).json()
    assert detail["company_name"] == "Acme Labs"
    assert detail["required_skills"] == ["Python", "FastAPI"]

    mine = client.get(f"{API}/my-posts", headers=company_headers)
    assert mine.status_code == 200
    assert len(mine.json()) == 2

    assert client.get(f"{API}/999999", headers=asha_headers).status_code == 404


def test_every_internship_response_says_when_it_was_posted(client, seeded, company_headers, asha_headers, db_session):
    """The details dialog read created_at, which no response carried, and showed "Posted on: Invalid Date"."""
    seeded.backend.created_at = datetime(2026, 10, 20, 9, 30, tzinfo=UTC)
    db_session.commit()

    responses = {
        "list": client.get(f"{API}/list").json(),
        "my-posts": client.get(f"{API}/my-posts", headers=company_headers).json(),
        "detail": [client.get(f"{API}/{seeded.backend.id}", headers=asha_headers).json()],
    }

    for name, items in responses.items():
        backend = next(item for item in items if item["id"] == seeded.backend.id)
        posted = datetime.fromisoformat(backend["created_at"])
        # PostgreSQL answers in the server's time zone, SQLite drops the zone and keeps UTC
        posted = posted if posted.tzinfo else posted.replace(tzinfo=UTC)
        assert posted == datetime(2026, 10, 20, 9, 30, tzinfo=UTC), name


def test_update_replaces_fields_and_the_embedding(client, seeded, company_headers, fake_rag):
    before = list(fake_rag.get_internship_embedding(str(seeded.backend.id)))
    body = {"title": "Go Intern", "description": "Write Go microservices", "required_skills": ["Go"]}

    response = client.put(f"{API}/{seeded.backend.id}", json=body, headers=company_headers)

    assert response.status_code == 200
    assert response.json()["title"] == "Go Intern"
    assert list(fake_rag.get_internship_embedding(str(seeded.backend.id))) != before


def test_only_the_owner_or_an_admin_can_edit_or_delete(client, seeded, make_user, auth_headers):
    other = auth_headers(make_user(role=UserRole.company))
    admin = auth_headers(make_user(role=UserRole.admin))
    body = {"title": "x", "description": "y"}

    assert client.put(f"{API}/{seeded.backend.id}", json=body, headers=other).status_code == 403
    assert client.delete(f"{API}/{seeded.backend.id}", headers=other).status_code == 403
    assert client.put(f"{API}/999999", json=body, headers=admin).status_code == 404
    assert client.delete(f"{API}/999999", headers=admin).status_code == 404
    assert client.put(f"{API}/{seeded.frontend.id}", json=body, headers=admin).status_code == 200


def test_delete_deactivates_and_drops_the_embedding(client, seeded, company_headers, fake_rag, asha_headers):
    assert client.delete(f"{API}/{seeded.frontend.id}", headers=company_headers).status_code == 204
    assert fake_rag.get_internship_embedding(str(seeded.frontend.id)) is None
    assert client.get(f"{API}/{seeded.frontend.id}", headers=asha_headers).status_code == 404


# -- recommendations --------------------------------------------------------------


def test_match_ranks_internships_for_a_student(client, seeded, asha_headers):
    response = client.get(f"{API}/match", params={"top_k": 5}, headers=asha_headers)

    assert response.status_code == 200
    results = response.json()
    assert [r["title"] for r in results] == ["Backend Intern", "Frontend Intern"]
    assert results[0]["match_score"] == 95
    assert results[0]["has_applied"] is False


def test_match_rules(client, seeded, company_headers, make_user, auth_headers):
    assert client.get(f"{API}/match", headers=company_headers).status_code == 403
    no_resume = auth_headers(make_user(role=UserRole.student))
    assert client.get(f"{API}/match", headers=no_resume).status_code == 404
    assert client.get(f"{API}/match", params={"top_k": 0}, headers=no_resume).status_code == 400


# -- AI helpers ---------------------------------------------------------------------


@pytest.fixture
def fresh_singletons(monkeypatch):
    monkeypatch.setattr(job_description_analyzer, "_job_description_analyzer", None)
    monkeypatch.setattr(internship_document_parser, "_internship_document_parser", None)


def test_extract_skills(client, company_headers, asha_headers, fake_gemini, fresh_singletons):
    fake_gemini.reply('{"required_skills": ["Python", "FastAPI"], "preferred_skills": ["Docker"]}')

    response = client.post(f"{API}/extract-skills", json={"job_description": JD}, headers=company_headers)

    assert response.json() == {"required_skills": ["Python", "FastAPI"], "preferred_skills": ["Docker"]}
    assert client.post(f"{API}/extract-skills", json={"job_description": JD}, headers=asha_headers).status_code == 403
    short = client.post(f"{API}/extract-skills", json={"job_description": "too short"}, headers=company_headers)
    assert short.status_code == 400


def test_parse_document(client, company_headers, fake_gemini, fresh_singletons):
    fake_gemini.reply(json.dumps({"title": "Backend Intern", "description": JD * 2, "required_skills": ["Python"]}))

    response = client.post(
        f"{API}/parse-document", files={"file": ("jd.txt", JD.encode(), "text/plain")}, headers=company_headers
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Backend Intern"
    assert response.json()["required_skills"] == ["Python"]


def test_parse_document_rejects_bad_files(client, company_headers, asha_headers, fresh_singletons):
    files = {"file": ("jd.exe", b"x", "application/octet-stream")}
    assert client.post(f"{API}/parse-document", files=files, headers=company_headers).status_code == 400
    short = {"file": ("jd.txt", b"tiny", "text/plain")}
    assert client.post(f"{API}/parse-document", files=short, headers=company_headers).status_code == 400
    assert client.post(f"{API}/parse-document", files=short, headers=asha_headers).status_code == 403
