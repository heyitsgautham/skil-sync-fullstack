"""PUT /api/students/profile: the Resume Intelligence page saves parsed skills and experience here."""

from app.models.user import User, UserRole

API = "/api/students/profile"


def test_saves_skills_and_experience(client, make_user, auth_headers, db_session):
    student = make_user(role=UserRole.student)

    response = client.put(
        API, json={"skills": ["Python", "SQL"], "total_experience_years": 1.5}, headers=auth_headers(student)
    )

    assert response.status_code == 200
    saved = db_session.query(User).filter(User.id == student.id).one()
    assert saved.skills == ["Python", "SQL"]
    assert saved.total_experience_years == 1.5


def test_leaves_fields_that_are_not_sent(client, make_user, auth_headers, db_session):
    student = make_user(role=UserRole.student, skills=["Go"], total_experience_years=2.0)

    client.put(API, json={"total_experience_years": 3}, headers=auth_headers(student))

    saved = db_session.query(User).filter(User.id == student.id).one()
    assert saved.skills == ["Go"]
    assert saved.total_experience_years == 3


def test_rejects_malformed_values_and_non_students(client, make_user, auth_headers):
    student = auth_headers(make_user(role=UserRole.student))

    assert client.put(API, json={"skills": "Python"}, headers=student).status_code == 422
    assert client.put(API, json={"total_experience_years": "lots"}, headers=student).status_code == 422
    company = auth_headers(make_user(role=UserRole.company))
    assert client.put(API, json={"skills": []}, headers=company).status_code == 403
