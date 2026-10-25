"""POST /api/filter/rank-candidates/{id} over pre-computed matches, the default discovery mode."""

import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole


@pytest.fixture
def ranked_setup(db_session, make_user):
    company = make_user(role=UserRole.company)
    internship = Internship(
        company_id=company.id,
        title="Backend intern",
        description="Build FastAPI services",
        required_skills=["Python"],
        min_experience=0,
    )
    db_session.add(internship)
    db_session.commit()

    students = [
        ("Senior", 88.0, 4, ["Python", "FastAPI"], "Master of Science"),
        ("Mid", 72.0, 2, ["Python"], "Bachelor of Engineering"),
        ("Junior", 55.0, 0, ["JavaScript"], "Bachelor of Arts"),
    ]
    ids = {}
    for name, score, years, skills, degree in students:
        student = make_user(role=UserRole.student, full_name=name)
        resume = Resume(
            student_id=student.id,
            file_path=f"/tmp/{name}.pdf",
            file_name=f"{name}.pdf",
            parsed_data={
                "all_skills": skills,
                "total_experience_years": years,
                "personal_info": {"education": [{"degree": degree}]},
            },
        )
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id,
                internship_id=internship.id,
                resume_id=resume.id,
                base_similarity_score=score,
                semantic_similarity=score,
                skills_match_score=score,
                experience_match_score=score,
            )
        )
        db_session.commit()
        ids[name] = student.id
    return company, internship.id, ids


def rank(client, auth_headers, company, internship_id, **params):
    return client.post(f"/api/filter/rank-candidates/{internship_id}", params=params, headers=auth_headers(company))


def test_ranks_every_matched_student_by_score(client, auth_headers, ranked_setup):
    company, internship_id, ids = ranked_setup

    body = rank(client, auth_headers, company, internship_id).json()

    assert body["success"] is True
    assert [c["candidate_id"] for c in body["ranked_candidates"]] == [ids["Senior"], ids["Mid"], ids["Junior"]]
    assert body["filters_applied"] == []
    assert all(c["is_flagged"] is False for c in body["ranked_candidates"])


def test_applies_score_skill_and_education_filters(client, auth_headers, ranked_setup):
    company, internship_id, ids = ranked_setup

    body = rank(client, auth_headers, company, internship_id, min_match_score=60, filter_skills="python").json()
    assert [c["candidate_id"] for c in body["ranked_candidates"]] == [ids["Senior"], ids["Mid"]]
    assert body["filters_applied"] == ["match_score >= 60.0%", "skills contain: python"]

    body = rank(client, auth_headers, company, internship_id, education_level="Master").json()
    assert [c["candidate_id"] for c in body["ranked_candidates"]] == [ids["Senior"]]


def test_flagged_students_can_be_excluded(client, auth_headers, ranked_setup, db_session):
    company, internship_id, ids = ranked_setup
    from app.models.user import User

    for name in ("Mid", "Junior"):
        db_session.query(User).filter(User.id == ids[name]).update({"phone": "+91 98765 43210"})
    db_session.commit()

    body = rank(client, auth_headers, company, internship_id).json()
    flagged = {c["candidate_id"] for c in body["ranked_candidates"] if c["is_flagged"]}
    assert flagged == {ids["Mid"], ids["Junior"]}

    body = rank(client, auth_headers, company, internship_id, exclude_flagged=True).json()
    assert [c["candidate_id"] for c in body["ranked_candidates"]] == [ids["Senior"]]
    assert "excluding flagged candidates" in body["filters_applied"]


def test_other_companies_cannot_rank_the_internship(client, auth_headers, make_user, ranked_setup):
    _, internship_id, _ = ranked_setup
    other = make_user(role=UserRole.company)
    assert rank(client, auth_headers, other, internship_id).status_code == 403


def test_unknown_internship_returns_404(client, auth_headers, ranked_setup):
    company, _, _ = ranked_setup
    assert rank(client, auth_headers, company, "999999").status_code == 404
