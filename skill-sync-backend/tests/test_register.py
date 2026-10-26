"""POST /api/auth/register: anyone may sign up as a student or company, only an admin may add an admin."""

import pytest

from app.models.user import User, UserRole

API = "/api/auth/register"


def body(role, email="new@example.com"):
    return {"email": email, "password": "long-enough-1", "full_name": "New Person", "role": role}


@pytest.mark.parametrize("role", ["student", "company"])
def test_anyone_can_sign_up_as_a_student_or_company_and_log_in(client, db_session, role):
    response = client.post(API, json=body(role))

    assert response.status_code == 201
    assert db_session.query(User).filter(User.email == "new@example.com").one().role == UserRole(role)
    login = client.post("/api/auth/login", json={"email": "new@example.com", "password": "long-enough-1"})
    assert login.status_code == 200


def test_an_anonymous_caller_cannot_create_an_admin(client, db_session):
    response = client.post(API, json=body("admin"))

    assert response.status_code == 403
    assert db_session.query(User).filter(User.email == "new@example.com").first() is None


@pytest.mark.parametrize("role", [UserRole.student, UserRole.company])
def test_a_signed_in_non_admin_cannot_create_an_admin(client, db_session, make_user, auth_headers, role):
    response = client.post(API, json=body("admin"), headers=auth_headers(make_user(role=role)))

    assert response.status_code == 403
    assert db_session.query(User).filter(User.email == "new@example.com").first() is None


def test_a_bad_token_cannot_create_an_admin(client):
    response = client.post(API, json=body("admin"), headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 403


def test_an_admin_can_add_another_admin(client, db_session, make_user, auth_headers):
    admin = make_user(role=UserRole.admin)

    response = client.post(API, json=body("admin"), headers=auth_headers(admin))

    assert response.status_code == 201
    assert db_session.query(User).filter(User.email == "new@example.com").one().role == UserRole.admin


def test_a_duplicate_email_is_rejected(client, make_user):
    make_user(role=UserRole.student, email="taken@example.com")

    response = client.post(API, json=body("student", email="taken@example.com"))

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"
