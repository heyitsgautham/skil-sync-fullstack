"""An original resume is served with its own media type, so the browser can show a .txt or .docx resume."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.models.resume import Resume
from app.models.user import UserRole
from app.routes.resume_view import TEMP_TOKEN_SECRET
from app.services.s3_service import s3_service


@pytest.fixture(autouse=True)
def local_storage_only(monkeypatch):
    monkeypatch.setattr(s3_service, "enabled", False)


@pytest.mark.parametrize(
    "file_name,content,media_type",
    [
        ("cv.pdf", b"%PDF-1.4 resume", "application/pdf"),
        ("cv.txt", b"Plain text resume", "text/plain; charset=utf-8"),
        ("cv.docx", b"PK docx bytes", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ],
)
def test_view_and_download_use_the_files_media_type(
    client, db_session, make_user, auth_headers, tmp_path, file_name, content, media_type
):
    student = make_user(role=UserRole.student)
    path = tmp_path / file_name
    path.write_bytes(content)
    resume = Resume(student_id=student.id, file_path=str(path), file_name=file_name, is_active=1)
    db_session.add(resume)
    db_session.commit()
    token = jwt.encode(
        {"resume_id": resume.id, "exp": datetime.now(UTC) + timedelta(minutes=5)}, TEMP_TOKEN_SECRET, algorithm="HS256"
    )

    view = client.get(f"/api/resumes/{resume.id}/view", params={"token": token})
    download = client.get(f"/api/resumes/{resume.id}/download", headers=auth_headers(student))

    for response in (view, download):
        assert response.status_code == 200
        assert response.headers["content-type"] == media_type
        assert response.content == content
