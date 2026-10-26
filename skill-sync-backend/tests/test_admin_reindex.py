"""POST /api/admin/reindex-all-students re-parses and re-embeds every stored resume file.

It used to match files to students by the part of the email before the "@" against the part of the
file name before the first "_", which never agree for the seeded "aarav.sharma@..." and
"aarav_sharma_resume.txt", and it built Resume(embedding=...) although Resume has no such column.
Every file failed, while the dashboard reported the job as started.
"""

import json

import pytest

from app.models.resume import Resume
from app.models.user import User, UserRole
from app.routes import admin as admin_routes

PARSED = {
    "aarav_sharma_resume.txt": ["Python", "FastAPI"],
    "diya_patel_resume.txt": ["React", "TypeScript"],
}


@pytest.fixture
def stored_resumes(db_session, make_user, fake_rag, fake_gemini, tmp_path, monkeypatch):
    resume_dir = tmp_path / "resumes"
    resume_dir.mkdir()
    monkeypatch.setattr(admin_routes, "RESUME_DIR", str(resume_dir))

    students = {}
    for file_name, skills in PARSED.items():
        first, last = file_name.split("_")[:2]
        student = make_user(role=UserRole.student, email=f"{first}.{last}@student.com", full_name=f"{first} {last}")
        (resume_dir / file_name).write_text(f"{first.title()} {last.title()}\nSkills: {', '.join(skills)}")
        db_session.add(
            Resume(
                student_id=student.id,
                file_path=f"app/public/resumes/{file_name}",
                file_name=file_name,
                is_active=1,
            )
        )
        students[file_name] = student
    (resume_dir / "nobody_resume.txt").write_text("A file no account owns")
    db_session.commit()

    # The route walks the directory in name order: aarav, diya, then nobody, which it skips.
    for file_name in sorted(PARSED):
        fake_gemini.reply(json.dumps({"skills": {"technical": PARSED[file_name]}, "experience": []}))
    return students


def test_reindex_parses_and_embeds_each_students_resume(
    client, make_user, auth_headers, db_session, stored_resumes, fake_gemini
):
    response = client.post("/api/admin/reindex-all-students", headers=auth_headers(make_user(role=UserRole.admin)))

    assert response.status_code == 200
    assert response.json()["total_files"] == 3
    assert len(fake_gemini.prompts) == 2, "the file no account owns is skipped before calling Gemini"
    for file_name, student in stored_resumes.items():
        resumes = db_session.query(Resume).filter(Resume.student_id == student.id).all()
        assert len(resumes) == 1, "re-indexing updates the stored resume instead of adding another"
        (resume,) = resumes
        db_session.refresh(resume)
        assert resume.is_active == 1
        assert resume.embedding_id
        assert sorted(resume.parsed_data["all_skills"]) == sorted(PARSED[file_name])
        assert sorted(db_session.get(User, student.id).skills) == sorted(PARSED[file_name])


def test_only_admins_can_reindex(client, make_user, auth_headers):
    response = client.post("/api/admin/reindex-all-students", headers=auth_headers(make_user(role=UserRole.company)))

    assert response.status_code == 403


def test_reindex_keeps_a_resume_gemini_cannot_parse(
    client, make_user, auth_headers, db_session, stored_resumes, fake_gemini
):
    diya = stored_resumes["diya_patel_resume.txt"]
    resume = db_session.query(Resume).filter(Resume.student_id == diya.id).one()
    resume.parsed_data = {"all_skills": ["React"], "summary": "Frontend developer"}
    diya.skills = ["React"]
    db_session.commit()
    # aarav parses, then Gemini fails for diya
    fake_gemini.replies[1] = RuntimeError("quota exceeded")

    response = client.post("/api/admin/reindex-all-students", headers=auth_headers(make_user(role=UserRole.admin)))

    assert response.status_code == 200
    db_session.expire_all()
    resume = db_session.query(Resume).filter(Resume.student_id == diya.id).one()
    assert resume.parsed_data == {"all_skills": ["React"], "summary": "Frontend developer"}
    assert db_session.get(User, diya.id).skills == ["React"]
    aarav = stored_resumes["aarav_sharma_resume.txt"]
    assert sorted(db_session.get(User, aarav.id).skills) == ["FastAPI", "Python"]
