"""PUT /api/profile/me validates the body before it touches the account.

The endpoint took a raw dict, so a company could save "not-an-email" as its login email and lock
itself out, and a wrong type reached the database and came back as a 500.
"""

import pytest

from app.models.user import User, UserRole

API = "/api/profile/me"


@pytest.fixture
def company(make_user, auth_headers):
    user = make_user(role=UserRole.company, email="hr@acme.example")
    return user, auth_headers(user)


def test_company_cannot_save_an_invalid_login_email(client, company, db_session):
    user, headers = company

    response = client.put(API, json={"email": "not-an-email"}, headers=headers)

    assert response.status_code == 422
    assert db_session.query(User).filter(User.id == user.id).one().email == "hr@acme.example"
    login = client.post("/api/auth/login", json={"email": "hr@acme.example", "password": "password123"})
    assert login.status_code == 200


def test_company_can_change_its_email_and_log_in_with_it(client, company):
    _, headers = company

    updated = client.put(API, json={"email": "talent@acme.example"}, headers=headers)

    assert updated.status_code == 200
    assert updated.json()["email"] == "talent@acme.example"
    login = client.post("/api/auth/login", json={"email": "talent@acme.example", "password": "password123"})
    assert login.status_code == 200


@pytest.mark.parametrize(
    "body",
    [
        {"phone_visible": "sometimes"},
        {"mailing_email": "reports at acme"},
        {"full_name": "x" * 256},
        {"phone": "9" * 51},
        ["full_name"],
    ],
)
def test_malformed_updates_are_rejected_with_422(client, company, body):
    _, headers = company

    assert client.put(API, json=body, headers=headers).status_code == 422


def test_blank_form_fields_are_accepted(client, company, db_session):
    """The profile form sends "" for empty fields. A blank name or login email leaves it unchanged."""
    user, headers = company

    response = client.put(
        API,
        json={"full_name": "", "email": "", "mailing_email": "", "hr_contact_name": "", "phone_visible": False},
        headers=headers,
    )

    assert response.status_code == 200
    saved = db_session.query(User).filter(User.id == user.id).one()
    assert saved.full_name == user.full_name
    assert saved.email == "hr@acme.example"
    assert saved.mailing_email is None
    assert saved.hr_contact_name == ""
    assert saved.phone_visible is False


def test_student_fields_are_length_checked(client, make_user, auth_headers):
    student = make_user(role=UserRole.student)

    response = client.put(
        API, json={"linkedin_url": "https://linkedin.com/" + "a" * 500}, headers=auth_headers(student)
    )

    assert response.status_code == 422


def test_admin_can_rename_itself_and_nothing_else(client, make_user, auth_headers, db_session):
    """The admin profile page saves full_name. The endpoint used to ignore admins and answer 200."""
    admin = make_user(role=UserRole.admin, full_name="System Administrator")

    response = client.put(
        API, json={"full_name": "Head Admin", "email": "other@example.com", "phone": "1"}, headers=auth_headers(admin)
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Head Admin"
    saved = db_session.query(User).filter(User.id == admin.id).one()
    assert saved.full_name == "Head Admin"
    assert saved.email == admin.email
    assert saved.phone is None
