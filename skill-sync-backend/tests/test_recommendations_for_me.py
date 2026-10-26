"""GET /api/recommendations/for-me: a student's pre-computed matches, filtered, sorted and paged."""

from datetime import datetime, timedelta

import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole

API = "/api/recommendations/for-me"

POSTS = [
    # title, location, skills, score, days ago
    ("Backend Intern", "Bangalore", ["Python", "FastAPI"], 88, 2),
    ("Data Intern", "Remote", ["python", "SQL"], 74, 20),
    ("Frontend Intern", "Mumbai", ["React"], 51, 1),
]


@pytest.fixture
def student(db_session, make_user):
    company = make_user(role=UserRole.company)
    student = make_user(role=UserRole.student)
    resume = Resume(student_id=student.id, file_path="/tmp/cv", file_name="cv.txt", is_active=1)
    db_session.add(resume)
    db_session.commit()
    for title, location, skills, score, days in POSTS:
        internship = Internship(
            company_id=company.id,
            title=title,
            description="d",
            location=location,
            required_skills=skills,
            created_at=datetime.utcnow() - timedelta(days=days),
        )
        db_session.add(internship)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=score
            )
        )
    closed = Internship(company_id=company.id, title="Closed Intern", description="d", is_active=0)
    db_session.add(closed)
    db_session.commit()
    db_session.add(
        StudentInternshipMatch(
            student_id=student.id, internship_id=closed.id, resume_id=resume.id, base_similarity_score=99
        )
    )
    db_session.commit()
    return student


def titles(client, auth_headers, student, **params):
    response = client.get(API, params=params, headers=auth_headers(student))
    assert response.status_code == 200, response.text
    return [item["title"] for item in response.json()["items"]], response.json()


def test_lists_open_matches_best_first(client, auth_headers, student):
    names, body = titles(client, auth_headers, student)

    assert names == ["Backend Intern", "Data Intern", "Frontend Intern"]
    assert body["total"] == 3 and body["total_pages"] == 1
    assert body["items"][0]["match_score"] == 88


@pytest.mark.parametrize(
    "params,expected",
    [
        ({"min_score": 70}, ["Backend Intern", "Data Intern"]),
        ({"max_score": 60}, ["Frontend Intern"]),
        ({"skills": "Python"}, ["Backend Intern", "Data Intern"]),
        ({"skills": "react, sql"}, ["Data Intern", "Frontend Intern"]),
        ({"location": "remote"}, ["Data Intern"]),
        ({"days_posted": 7}, ["Backend Intern", "Frontend Intern"]),
        ({"sort_by": "title", "sort_order": "asc"}, ["Backend Intern", "Data Intern", "Frontend Intern"]),
        ({"sort_by": "date", "sort_order": "desc"}, ["Frontend Intern", "Backend Intern", "Data Intern"]),
    ],
)
def test_filters_and_sorting(client, auth_headers, student, params, expected):
    assert titles(client, auth_headers, student, **params)[0] == expected


def test_skills_filter_counts_and_pages_after_matching(client, auth_headers, student):
    first, body = titles(client, auth_headers, student, skills="python", page_size=1)
    second, _ = titles(client, auth_headers, student, skills="python", page_size=1, page=2)

    assert (first, second) == (["Backend Intern"], ["Data Intern"])
    assert body["total"] == 2 and body["total_pages"] == 2


def test_needs_an_active_resume_and_a_student(client, make_user, auth_headers):
    assert client.get(API, headers=auth_headers(make_user(role=UserRole.student))).status_code == 404
    assert client.get(API, headers=auth_headers(make_user(role=UserRole.company))).status_code == 403
