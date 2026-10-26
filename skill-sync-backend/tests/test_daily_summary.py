"""The daily applicant summary: who it goes to, what it lists, and the scheduled script that sends it."""

from datetime import datetime, timedelta

import pytest

from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import UserRole
from app.services import daily_summary as daily_summary_module
from app.services.email_service import email_service


@pytest.fixture
def outbox(monkeypatch):
    sent = []

    def fake_send(**kwargs):
        sent.append(kwargs)
        return True

    monkeypatch.setattr(email_service, "send_email", fake_send)
    return sent


@pytest.fixture
def applications(db_session, make_user):
    company = make_user(role=UserRole.company, full_name="Acme Labs", mailing_email="talent@acme.example")
    data = Internship(company_id=company.id, title="Data Intern", description="SQL")
    quiet = Internship(company_id=company.id, title="Quiet Intern", description="No one applied")
    db_session.add_all([data, quiet])
    db_session.commit()

    def apply(name, phone, hours_ago):
        student = make_user(role=UserRole.student, full_name=name, phone=phone, skills=["SQL", "Python"])
        resume = Resume(student_id=student.id, file_path="/tmp/cv", file_name="cv.txt")
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            Application(
                student_id=student.id,
                internship_id=data.id,
                resume_id=resume.id,
                match_score=81,
                created_at=datetime.utcnow() - timedelta(hours=hours_ago),
            )
        )
        db_session.commit()

    apply("Asha Raman", "98765 43210", hours_ago=2)
    apply("Old Applicant", None, hours_ago=50)
    return company


def test_the_summary_goes_to_the_mailing_email_and_lists_recent_applicants(client, auth_headers, outbox, applications):
    response = client.post("/api/notifications/send-daily-summary", headers=auth_headers(applications))

    body = response.json()
    assert body["success"] is True and body["email_sent"] is True
    assert body["total_applications"] == 1
    assert body["internships_with_applications"] == 1
    (email,) = outbox
    assert email["to_email"] == "talent@acme.example"
    assert "Asha Raman" in email["html_content"]
    assert "98765 43210" in email["html_content"]
    assert "Old Applicant" not in email["html_content"]


def test_the_login_email_is_used_without_a_mailing_email(db_session, applications):
    applications.mailing_email = None

    assert daily_summary_module.summary_recipient(applications) == applications.email


def test_preview_returns_the_html_without_sending(client, auth_headers, outbox, applications):
    body = client.get("/api/notifications/preview-daily-summary", headers=auth_headers(applications)).json()

    assert "Asha Raman" in body["preview_html"]
    assert outbox == []


def test_a_company_without_active_internships_gets_404(client, make_user, auth_headers):
    response = client.post(
        "/api/notifications/send-daily-summary", headers=auth_headers(make_user(role=UserRole.company))
    )

    assert response.status_code == 404


def test_students_cannot_request_summaries(client, make_user, auth_headers):
    response = client.post(
        "/api/notifications/send-daily-summary", headers=auth_headers(make_user(role=UserRole.student))
    )

    assert response.status_code == 403


def test_the_scheduled_script_mails_each_company_with_new_applicants(db_session, outbox, applications, make_user):
    from scripts import send_daily_emails

    make_user(role=UserRole.company, full_name="No Posts Inc")
    sent, skipped = send_daily_emails.send_daily_summaries(db_session)

    assert (sent, skipped) == (1, 1)
    assert [email["to_email"] for email in outbox] == ["talent@acme.example"]
