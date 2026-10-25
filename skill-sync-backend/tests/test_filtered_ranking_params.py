"""Skills, experience and education filters on the filtered ranking and export endpoints.

These ran as MySQL-only JSON functions and failed on Postgres and SQLite. The suite runs on SQLite by
default and on Postgres when TEST_DATABASE_URL points at one, so both backends pin the same rows.
"""

import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole
from app.services.candidate_filters import resume_matches

PEOPLE = [
    # name, skills, years, degree, score
    ("Asha", ["Python", "FastAPI"], 1.5, "Master of Science", 91),
    ("Ravi", ["React", "JavaScript"], 0.5, "Bachelor of Arts", 74),
    ("Meera", ["Python 3", "SQL"], 3.0, "Bachelor of Engineering", 58),
    ("Kiran", ["Go"], None, "Diploma", 40),
]


@pytest.fixture
def ranked(db_session, make_user, auth_headers):
    company = make_user(role=UserRole.company)
    internship = Internship(
        company_id=company.id, title="Backend Intern", description="APIs", required_skills=["Python"]
    )
    db_session.add(internship)
    db_session.commit()
    for name, skills, years, degree, score in PEOPLE:
        student = make_user(role=UserRole.student, full_name=name)
        parsed = {"all_skills": skills, "education": [{"degree": degree, "institution": "Master Academy"}]}
        if years is not None:
            parsed["total_experience_years"] = years
        resume = Resume(student_id=student.id, file_path="/tmp/cv", file_name="cv.txt", is_active=1, parsed_data=parsed)
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=score
            )
        )
    db_session.commit()
    return internship.id, auth_headers(company)


def names(client, url, headers, **params):
    response = client.get(url, params=params, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.parametrize(
    "params,expected",
    [
        ({}, ["Asha", "Ravi", "Meera", "Kiran"]),
        ({"skills": "python"}, ["Asha", "Meera"]),
        ({"skills": "react, go"}, ["Ravi", "Kiran"]),
        ({"experience_min": 1}, ["Asha", "Meera"]),
        ({"experience_max": 1}, ["Ravi"]),
        ({"experience_min": 1, "experience_max": 2}, ["Asha"]),
        ({"education_level": "bachelor"}, ["Ravi", "Meera"]),
        ({"education_level": "master"}, ["Asha"]),
        ({"skills": "python", "experience_min": 2}, ["Meera"]),
        ({"sort_by": "experience", "sort_order": "asc", "experience_min": 0}, ["Ravi", "Asha", "Meera"]),
    ],
)
def test_filtered_ranking(client, ranked, params, expected):
    internship_id, headers = ranked
    body = names(client, f"/api/filter/rank-candidates/{internship_id}/filtered", headers, **params)
    assert [c["candidate_name"] for c in body["ranked_candidates"]] == expected
    assert body["total"] == len(expected)


def test_filters_page_after_matching(client, ranked):
    internship_id, headers = ranked
    url = f"/api/filter/rank-candidates/{internship_id}/filtered"

    first = names(client, url, headers, skills="python, react", page_size=2)
    second = names(client, url, headers, skills="python, react", page_size=2, page=2)

    assert [c["candidate_name"] for c in first["ranked_candidates"]] == ["Asha", "Ravi"]
    assert [c["candidate_name"] for c in second["ranked_candidates"]] == ["Meera"]
    assert first["total"] == 3 and first["total_pages"] == 2


@pytest.mark.parametrize(
    "params,expected",
    [
        ({"skills": "python"}, ["Asha", "Meera"]),
        ({"experience_min": 1}, ["Asha", "Meera"]),
        ({"education_level": "master"}, ["Asha"]),
        ({"education_level": "master", "export_type": "all"}, ["Asha", "Ravi", "Meera", "Kiran"]),
        ({"skills": "python, react", "export_type": "current_page", "page_size": 2, "page": 2}, ["Meera"]),
    ],
)
def test_export(client, ranked, params, expected):
    internship_id, headers = ranked
    response = client.get(
        f"/api/filter/export-candidates/{internship_id}", params={"format": "csv", **params}, headers=headers
    )
    assert response.status_code == 200, response.text
    rows = response.text.strip().splitlines()[1:]
    assert [row.split(",")[0].split(" ")[0].strip('"') for row in rows] == expected


@pytest.mark.parametrize(
    "parsed,skills,education,expected",
    [
        ({"all_skills": ["Python 3"]}, "python", None, True),
        ({"all_skills": ["Java"]}, "python, rust", None, False),
        ({"all_skills": []}, " , ", None, True),
        ({"education": [{"degree": "MSc", "institution": "Master Academy"}]}, None, "master", False),
        ({"education": [{"degree": "Master of Arts"}]}, None, "MASTER", True),
        (None, "python", None, False),
        ({}, None, None, True),
    ],
)
def test_resume_matches(parsed, skills, education, expected):
    assert resume_matches(parsed, skills, education) is expected
