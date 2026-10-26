"""POST /api/candidate-emails/send-to-candidates: a company emails the students it picked from a ranking."""

import pytest

from app.models.internship import Internship
from app.models.user import UserRole
from app.services.email_service import email_service

API = "/api/candidate-emails/send-to-candidates"


@pytest.fixture
def posting(db_session, make_user):
    company = make_user(role=UserRole.company, full_name="Acme Labs")
    internship = Internship(company_id=company.id, title="Data Intern", description="SQL")
    db_session.add(internship)
    db_session.commit()
    students = [make_user(role=UserRole.student, full_name=name) for name in ("Asha", "Ravi")]
    return company, internship, students


def body(internship, students, **overrides):
    return {
        "internship_id": internship.id,
        "candidate_ids": [s.id for s in students],
        "subject": "Next round",
        "message": "We would like to talk.",
        **overrides,
    }


def test_sends_one_personal_email_per_candidate(client, auth_headers, monkeypatch, posting):
    company, internship, students = posting
    sent = []
    monkeypatch.setattr(email_service, "send_email", lambda **kwargs: sent.append(kwargs) or True)

    response = client.post(API, json=body(internship, students), headers=auth_headers(company))

    assert response.status_code == 200
    assert response.json()["emails_sent"] == 2 and response.json()["failed_emails"] == 0
    assert sorted(email["to_email"] for email in sent) == sorted(s.email for s in students)
    assert all(email["subject"] == "Next round" for email in sent)
    assert "Dear Asha" in next(e for e in sent if e["to_email"] == students[0].email)["text_content"]


def test_reports_each_failed_delivery_without_internal_details(client, auth_headers, monkeypatch, posting):
    company, internship, students = posting

    def flaky(**kwargs):
        if kwargs["to_email"] == students[1].email:
            raise ConnectionError("smtp.internal.example:587 refused")
        return True

    monkeypatch.setattr(email_service, "send_email", flaky)

    body_json = client.post(API, json=body(internship, students), headers=auth_headers(company)).json()

    assert (body_json["emails_sent"], body_json["failed_emails"]) == (1, 1)
    failed = next(d for d in body_json["details"] if d["status"] != "sent")
    assert failed["error"] == "Email could not be sent"
    assert "smtp.internal" not in str(body_json)


def test_only_the_owner_of_the_internship_can_send(client, make_user, auth_headers, posting):
    _, internship, students = posting
    other_company = make_user(role=UserRole.company)

    response = client.post(API, json=body(internship, students), headers=auth_headers(other_company))

    assert response.status_code == 404


def test_students_cannot_send_and_non_students_are_not_candidates(client, make_user, auth_headers, posting):
    company, internship, students = posting

    assert client.post(API, json=body(internship, students), headers=auth_headers(students[0])).status_code == 403
    response = client.post(API, json=body(internship, [company]), headers=auth_headers(company))
    assert response.status_code == 404
