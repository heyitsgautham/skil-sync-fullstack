"""Endpoints return their own 4xx status instead of wrapping it in a 500."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import UserRole
from app.routes.resume_view import TEMP_TOKEN_SECRET
from app.services.s3_service import s3_service


@pytest.fixture(autouse=True)
def local_storage_only(monkeypatch):
    monkeypatch.setattr(s3_service, "enabled", False)


@pytest.fixture
def company_internship(db_session, make_user):
    company = make_user(role=UserRole.company)
    internship = Internship(company_id=company.id, title="Data intern", description="SQL and Python")
    db_session.add(internship)
    db_session.commit()
    return company, internship.id


def view_token(resume_id):
    payload = {"resume_id": resume_id, "exp": datetime.now(UTC) + timedelta(minutes=5)}
    return jwt.encode(payload, TEMP_TOKEN_SECRET, algorithm="HS256")


def test_filtered_ranking_of_unknown_internship_is_404(client, make_user, auth_headers):
    company = make_user(role=UserRole.company)
    response = client.get("/api/filter/rank-candidates/999999/filtered", headers=auth_headers(company))
    assert response.status_code == 404


def test_filtered_ranking_of_another_companys_internship_is_403(client, make_user, auth_headers, company_internship):
    _, internship_id = company_internship
    other = make_user(role=UserRole.company)
    response = client.get(f"/api/filter/rank-candidates/{internship_id}/filtered", headers=auth_headers(other))
    assert response.status_code == 403


def test_profile_of_unknown_candidate_is_404(client, make_user, auth_headers):
    company = make_user(role=UserRole.company)
    response = client.get("/api/filter/candidate-profile/999999", headers=auth_headers(company))
    assert response.status_code == 404


def test_match_score_without_a_resume_is_404(client, make_user, auth_headers, company_internship):
    company, internship_id = company_internship
    student = make_user(role=UserRole.student)
    response = client.post(
        "/api/filter/match-score",
        params={"student_id": student.id, "internship_id": internship_id},
        headers=auth_headers(company),
    )
    assert response.status_code == 404


@pytest.fixture
def resume_without_file(db_session, make_user, tmp_path):
    student = make_user(role=UserRole.student)
    resume = Resume(student_id=student.id, file_path=str(tmp_path / "gone.pdf"), file_name="gone.pdf")
    db_session.add(resume)
    db_session.commit()
    return student, resume.id


def test_resume_view_with_a_missing_file_is_404(client, resume_without_file):
    _, resume_id = resume_without_file
    response = client.get(f"/api/resumes/{resume_id}/view", params={"token": view_token(resume_id)})
    assert response.status_code == 404
    assert response.json()["detail"] == "Resume file not found"


def test_resume_download_with_a_missing_file_is_404(client, auth_headers, resume_without_file):
    student, resume_id = resume_without_file
    response = client.get(f"/api/resumes/{resume_id}/download", headers=auth_headers(student))
    assert response.status_code == 404
    assert response.json()["detail"] == "Resume file not found"


def test_reindex_without_a_resume_directory_is_404(client, make_user, auth_headers, tmp_path, monkeypatch):
    admin = make_user(role=UserRole.admin)
    monkeypatch.chdir(tmp_path)  # app/public/resumes does not exist here

    response = client.post("/api/admin/reindex-all-students", headers=auth_headers(admin))

    assert response.status_code == 404
    assert "Resume directory not found" in response.json()["detail"]
