"""GET /api/auth/analytics counts the system's records and averages the real match scores."""

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole

API = "/api/auth/analytics"


def test_counts_and_average_match_score(client, db_session, make_user, auth_headers):
    admin = make_user(role=UserRole.admin)
    company = make_user(role=UserRole.company)
    students = [make_user(role=UserRole.student) for _ in range(2)]
    open_post = Internship(company_id=company.id, title="Open", description="d")
    closed_post = Internship(company_id=company.id, title="Closed", description="d", is_active=0)
    db_session.add_all([open_post, closed_post])
    db_session.commit()
    for student, score in zip(students, (70.0, 81.5), strict=True):
        resume = Resume(student_id=student.id, file_path="/tmp/cv", file_name="cv.txt", is_active=1)
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id, internship_id=open_post.id, resume_id=resume.id, base_similarity_score=score
            )
        )
    db_session.commit()

    body = client.get(API, headers=auth_headers(admin)).json()

    assert body == {
        "total_users": 4,
        "total_students": 2,
        "total_companies": 1,
        "total_admins": 1,
        "total_internships": 2,
        "active_internships": 1,
        "total_resumes": 2,
        "average_match_score": 75.8,
    }


def test_average_is_null_before_any_matches(client, make_user, auth_headers):
    body = client.get(API, headers=auth_headers(make_user(role=UserRole.admin))).json()

    assert body["average_match_score"] is None


def test_only_admins_see_analytics(client, make_user, auth_headers):
    response = client.get(API, headers=auth_headers(make_user(role=UserRole.company)))

    assert response.status_code == 403
