"""Student resume routes: list, activate, parsed data and delete."""

import pytest

from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole

API = "/api/resume"


@pytest.fixture
def student_with_resumes(db_session, make_user, tmp_path):
    student = make_user(role=UserRole.student)
    files = []
    resumes = []
    for index, active in enumerate((0, 1)):
        path = tmp_path / f"cv{index}.txt"
        path.write_text("resume text")
        files.append(path)
        resume = Resume(
            student_id=student.id,
            file_path=str(path),
            file_name=path.name,
            is_active=active,
            extracted_skills=["Python"] if index else None,
            parsed_data={"all_skills": ["SQL"], "education": [{"degree": "BSc"}]} if not index else None,
        )
        db_session.add(resume)
        resumes.append(resume)
    tailored = Resume(student_id=student.id, file_path="/tmp/t.txt", file_name="tailored.txt", is_tailored=1)
    db_session.add(tailored)
    db_session.commit()
    return student, resumes, files


def test_lists_base_resumes_with_skills_from_either_field(client, auth_headers, student_with_resumes):
    student, resumes, _ = student_with_resumes

    body = client.get(f"{API}/my-resumes", headers=auth_headers(student)).json()

    assert sorted(r["file_name"] for r in body) == ["cv0.txt", "cv1.txt"]
    skills = {r["file_name"]: r["extracted_skills"] for r in body}
    assert skills == {"cv0.txt": ["SQL"], "cv1.txt": ["Python"]}


def test_activating_one_resume_deactivates_the_others(client, auth_headers, db_session, student_with_resumes):
    student, (old, current), _ = student_with_resumes

    response = client.put(f"{API}/{old.id}/activate", headers=auth_headers(student))

    assert response.status_code == 200
    db_session.refresh(old)
    db_session.refresh(current)
    assert (old.is_active, current.is_active) == (1, 0)


def test_parsed_data_reports_counts_and_404s_without_data(client, auth_headers, student_with_resumes):
    student, (parsed, unparsed), _ = student_with_resumes

    body = client.get(f"{API}/{parsed.id}/parsed-data", headers=auth_headers(student)).json()
    missing = client.get(f"{API}/{unparsed.id}/parsed-data", headers=auth_headers(student))

    assert body["processing_details"]["skills_extracted"] == 1
    assert body["processing_details"]["education_found"] == 1
    assert missing.status_code == 404


def test_another_student_cannot_touch_the_resumes(client, make_user, auth_headers, student_with_resumes):
    _, (resume, _), _ = student_with_resumes
    other = auth_headers(make_user(role=UserRole.student))

    assert client.put(f"{API}/{resume.id}/activate", headers=other).status_code == 404
    assert client.get(f"{API}/{resume.id}/parsed-data", headers=other).status_code == 404
    assert client.delete(f"{API}/{resume.id}", headers=other).status_code == 404


def test_deleting_a_matched_resume_removes_it_its_file_and_its_matches(
    client, auth_headers, db_session, make_user, student_with_resumes
):
    """Pre-computed matches point at the resume they were scored from, so they have to go with it."""
    student, (resume, _), (path, _) = student_with_resumes
    company = make_user(role=UserRole.company)
    internship = Internship(company_id=company.id, title="Intern", description="d")
    db_session.add(internship)
    db_session.commit()
    db_session.add(
        StudentInternshipMatch(
            student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=70
        )
    )
    db_session.commit()
    resume_id = resume.id

    response = client.delete(f"{API}/{resume_id}", headers=auth_headers(student))

    assert response.status_code == 204
    db_session.expire_all()
    assert db_session.get(Resume, resume_id) is None
    assert not path.exists()
    assert db_session.query(StudentInternshipMatch).filter(StudentInternshipMatch.resume_id == resume_id).count() == 0


def test_a_resume_used_in_an_application_cannot_be_deleted(
    client, auth_headers, db_session, make_user, student_with_resumes
):
    student, (resume, _), (path, _) = student_with_resumes
    company = make_user(role=UserRole.company)
    internship = Internship(company_id=company.id, title="Intern", description="d")
    db_session.add(internship)
    db_session.commit()
    db_session.add(Application(student_id=student.id, internship_id=internship.id, resume_id=resume.id))
    db_session.commit()

    response = client.delete(f"{API}/{resume.id}", headers=auth_headers(student))

    assert response.status_code == 400
    assert "1 application(s)" in response.json()["detail"]
    assert path.exists()


def test_companies_cannot_list_or_upload_resumes(client, make_user, auth_headers):
    headers = auth_headers(make_user(role=UserRole.company))

    assert client.get(f"{API}/my-resumes", headers=headers).status_code == 403
    upload = client.post(f"{API}/upload", files={"file": ("cv.txt", b"x", "text/plain")}, headers=headers)
    assert upload.status_code == 403


def test_deleting_a_base_resume_keeps_its_tailored_copies(client, auth_headers, db_session, student_with_resumes):
    student, (base, _), _ = student_with_resumes
    tailored = Resume(
        student_id=student.id, file_path="/tmp/tailored-x.txt", file_name="t.txt", is_tailored=1, base_resume_id=base.id
    )
    db_session.add(tailored)
    db_session.commit()
    tailored_id = tailored.id

    response = client.delete(f"{API}/{base.id}", headers=auth_headers(student))

    assert response.status_code == 204
    db_session.expire_all()
    kept = db_session.get(Resume, tailored_id)
    assert kept is not None and kept.base_resume_id is None
