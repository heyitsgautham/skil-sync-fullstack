"""Opening a resume stored in S3 serves the file and then deletes the local copy.

The original resume path downloaded the object to a temp file and passed a lambda as the
response's background task. Starlette awaits the background task, so after sending the file it
raised TypeError ("object NoneType can't be used in 'await' expression") on every request.
"""

import os
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.models.resume import Resume
from app.models.user import UserRole
from app.routes.resume_view import TEMP_TOKEN_SECRET
from app.services.s3_service import s3_service

PDF = b"%PDF-1.4 fake resume body"


@pytest.fixture
def s3_resume(db_session, make_user, monkeypatch, tmp_path):
    downloads = []

    def fake_download(key, path):
        downloads.append(path)
        with open(path, "wb") as handle:
            handle.write(PDF)
        return True

    monkeypatch.setattr(s3_service, "enabled", True)
    monkeypatch.setattr(s3_service, "download_resume", fake_download)
    monkeypatch.setattr("tempfile.tempdir", str(tmp_path))

    student = make_user(role=UserRole.student)
    resume = Resume(
        student_id=student.id, file_path="/missing/local/copy.pdf", file_name="cv.pdf", s3_key="resumes/cv.pdf"
    )
    db_session.add(resume)
    db_session.commit()
    return student, resume.id, downloads


def view_token(resume_id):
    payload = {"resume_id": resume_id, "exp": datetime.now(UTC) + timedelta(minutes=5)}
    return jwt.encode(payload, TEMP_TOKEN_SECRET, algorithm="HS256")


def test_viewing_an_s3_resume_serves_it_and_removes_the_temp_copy(client, s3_resume):
    _, resume_id, downloads = s3_resume

    response = client.get(f"/api/resumes/{resume_id}/view", params={"token": view_token(resume_id)})

    assert response.status_code == 200
    assert response.content == PDF
    assert response.headers["content-type"] == "application/pdf"
    (temp_copy,) = downloads
    assert not os.path.exists(temp_copy)


def test_downloading_an_s3_resume_serves_it_and_removes_the_temp_copy(client, s3_resume, auth_headers):
    student, resume_id, downloads = s3_resume

    response = client.get(f"/api/resumes/{resume_id}/download", headers=auth_headers(student))

    assert response.status_code == 200
    assert response.content == PDF
    assert 'filename="cv.pdf"' in response.headers["content-disposition"]
    (temp_copy,) = downloads
    assert not os.path.exists(temp_copy)
