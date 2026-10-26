"""Profile routes: per-role profiles, company job stats, and the emailed job report."""

import pytest

from app.models.user import User, UserRole
from app.routes import profile as profile_module
from app.services.batch_matching_service import BatchMatchingService

API = "/api/profile"


@pytest.fixture
def sent(monkeypatch):
    """Capture emails instead of sending them."""
    outbox = []

    def fake_send(**kwargs):
        outbox.append(kwargs)
        return True

    monkeypatch.setattr(profile_module.email_service, "send_email", fake_send)
    return outbox


@pytest.fixture
def matched(seeded, db_session):
    BatchMatchingService(db_session).compute_all_matches()
    return seeded


def test_each_role_gets_its_own_profile_fields(client, make_user, auth_headers):
    student = client.get(f"{API}/me", headers=auth_headers(make_user(role=UserRole.student))).json()
    company = client.get(f"{API}/me", headers=auth_headers(make_user(role=UserRole.company))).json()
    admin = client.get(f"{API}/me", headers=auth_headers(make_user(role=UserRole.admin))).json()

    assert "linkedin_url" in student and "hr_contact_name" not in student
    assert "hr_contact_name" in company and "phone_visible" in company
    assert set(admin) == {"id", "email", "full_name", "role"}


def test_student_updates_contact_details(client, make_user, auth_headers, db_session):
    student = make_user(role=UserRole.student)
    body = {
        "full_name": "New Name",
        "phone": "9876543210",
        "linkedin_url": "https://linkedin.com/in/new-name",
        "github_url": "https://github.com/new-name",
        "email": "x@y.z",
    }

    updated = client.put(f"{API}/me", json=body, headers=auth_headers(student)).json()

    assert updated["full_name"] == "New Name"
    assert updated["github_url"] == "https://github.com/new-name"
    assert db_session.query(User).filter(User.id == student.id).one().email == student.email


def test_company_updates_and_cannot_take_another_email(client, make_user, auth_headers):
    taken = make_user(role=UserRole.student)
    company = make_user(role=UserRole.company)
    headers = auth_headers(company)

    ok = client.put(f"{API}/me", json={"hr_contact_name": "Priya", "phone_visible": True}, headers=headers).json()
    clash = client.put(f"{API}/me", json={"email": taken.email}, headers=headers)

    assert ok["hr_contact_name"] == "Priya" and ok["phone_visible"] is True
    assert clash.status_code == 400


def test_job_email_stats_bucket_matches(client, matched, auth_headers):
    body = client.get(f"{API}/job-email-stats", headers=auth_headers(matched.company)).json()

    jobs = {job["internship_title"]: job for job in body["jobs"]}
    backend = jobs["Backend Intern"]
    assert backend["total_applicants"] == 3
    assert backend["great_matches"] + backend["good_matches"] + backend["bad_matches"] == 3
    assert body["all_jobs_stats"]["total_applicants"] == 6


def test_only_companies_see_stats_or_send_reports(client, matched, auth_headers):
    headers = auth_headers(matched.students["asha"])
    assert client.get(f"{API}/job-email-stats", headers=headers).status_code == 403
    assert client.post(f"{API}/send-job-email/{matched.backend.id}", headers=headers).status_code == 403


def test_sends_a_job_report_with_csv_and_excel(client, matched, auth_headers, sent):
    response = client.post(f"{API}/send-job-email/{matched.backend.id}", headers=auth_headers(matched.company))

    assert response.status_code == 200
    assert response.json()["total_applicants"] == 3
    (email,) = sent
    assert email["to_email"] == matched.company.email
    names = [attachment[0] for attachment in email["attachments"]]
    assert names[0].endswith(".csv") and names[1].endswith(".xlsx")
    assert b"Asha" in email["attachments"][0][1]
    assert "Backend Intern" in email["html_content"]


def test_job_report_filters_and_errors(client, matched, auth_headers, sent):
    headers = auth_headers(matched.company)
    url = f"{API}/send-job-email/{matched.backend.id}"
    stats = client.get(f"{API}/job-email-stats", headers=headers).json()
    backend = next(job for job in stats["jobs"] if job["internship_id"] == matched.backend.id)
    buckets = {"great": backend["great_matches"], "good": backend["good_matches"], "other": backend["bad_matches"]}

    assert client.post(url, params={"filters": ["nonsense"]}, headers=headers).status_code == 400
    assert client.post(f"{API}/send-job-email/999999", headers=headers).status_code == 404
    for name, count in buckets.items():
        response = client.post(url, params={"filters": [name]}, headers=headers)
        if count:
            assert response.json()["total_applicants"] == count
        else:
            assert response.status_code == 404


def test_report_fails_when_smtp_fails(client, matched, auth_headers, monkeypatch):
    monkeypatch.setattr(profile_module.email_service, "send_email", lambda **kwargs: False)
    response = client.post(f"{API}/send-job-email/{matched.backend.id}", headers=auth_headers(matched.company))
    assert response.status_code == 500


def test_all_jobs_report(client, matched, auth_headers, sent):
    response = client.post(f"{API}/send-job-email/0", headers=auth_headers(matched.company))

    assert response.status_code == 200
    assert response.json()["internship_title"] == "All Jobs"
    assert response.json()["total_applicants"] == 6
