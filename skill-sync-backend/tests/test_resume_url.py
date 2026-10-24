"""Tests for GET /api/recommendations/resume/{student_id}."""

import pytest

from app.models.resume import Resume
from app.models.user import UserRole
from app.services.s3_service import s3_service


@pytest.fixture(autouse=True)
def local_storage_only(monkeypatch):
    """Force the local-file path, whatever AWS settings the machine has."""
    monkeypatch.setattr(s3_service, "enabled", False)


@pytest.fixture
def student_with_resume(db_session, make_user, tmp_path):
    student = make_user(UserRole.student)
    resume_file = tmp_path / "resume.pdf"
    resume_file.write_bytes(b"%PDF-1.4 test")
    resume = Resume(
        student_id=student.id,
        file_path=str(resume_file),
        file_name="resume.pdf",
        is_active=1,
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return student, resume


def url_for(student_id):
    return f"/api/recommendations/resume/{student_id}"


def test_company_without_anonymization_gets_local_resume(client, make_user, auth_headers, student_with_resume):
    company = make_user(UserRole.company, anonymization_enabled=False)
    student, resume = student_with_resume

    response = client.get(url_for(student.id), headers=auth_headers(company))

    assert response.status_code == 200
    body = response.json()
    assert body["storage_type"] == "local"
    assert body["anonymized"] is False
    assert body["resume_id"] == resume.id
    assert body["file_name"] == "resume.pdf"


def test_missing_local_file_returns_404(client, db_session, make_user, auth_headers, student_with_resume):
    company = make_user(UserRole.company, anonymization_enabled=False)
    student, resume = student_with_resume
    resume.file_path = "/nonexistent/resume.pdf"
    db_session.commit()

    response = client.get(url_for(student.id), headers=auth_headers(company))

    assert response.status_code == 404
    assert response.json()["detail"] == "Resume file not found"


def test_company_with_anonymization_gets_tokenized_view_url(client, make_user, auth_headers, student_with_resume):
    company = make_user(UserRole.company, anonymization_enabled=True)
    student, resume = student_with_resume

    response = client.get(url_for(student.id), headers=auth_headers(company))

    assert response.status_code == 200
    body = response.json()
    assert body["storage_type"] == "api"
    assert f"/api/resumes/{resume.id}/view?token=" in body["url"]


def test_student_cannot_view_resumes(client, make_user, auth_headers, student_with_resume):
    student, _ = student_with_resume

    response = client.get(url_for(student.id), headers=auth_headers(student))

    assert response.status_code == 403


def test_unknown_student_returns_404(client, make_user, auth_headers):
    company = make_user(UserRole.company)

    response = client.get(url_for(9999), headers=auth_headers(company))

    assert response.status_code == 404


def test_requires_authentication(client):
    response = client.get(url_for(1))

    assert response.status_code == 401
