"""JWT access tokens: creation, verification and rejection."""

from datetime import timedelta

import jwt

from app.models.user import UserRole
from app.utils.security import ALGORITHM, SECRET_KEY, create_access_token, decode_access_token


def test_token_round_trips_its_claims():
    token = create_access_token({"sub": "a@example.com", "role": "student"})
    payload = decode_access_token(token)
    assert payload["sub"] == "a@example.com"
    assert payload["role"] == "student"
    assert "exp" in payload


def test_expired_token_is_rejected():
    token = create_access_token({"sub": "a@example.com"}, expires_delta=timedelta(seconds=-1))
    assert decode_access_token(token) is None


def test_token_signed_with_another_key_is_rejected():
    token = jwt.encode({"sub": "a@example.com"}, "another-key-that-is-at-least-32-bytes", algorithm=ALGORITHM)
    assert decode_access_token(token) is None


def test_unsigned_token_is_rejected():
    token = jwt.encode({"sub": "a@example.com"}, key=None, algorithm="none")
    assert decode_access_token(token) is None


def test_garbage_token_is_rejected():
    assert decode_access_token("not.a.jwt") is None


def test_protected_endpoint_accepts_a_valid_token(client, make_user, auth_headers):
    admin = make_user(role=UserRole.admin)
    response = client.get("/api/auth/users", headers=auth_headers(admin))
    assert response.status_code == 200


def test_protected_endpoint_rejects_an_expired_token(client, make_user):
    admin = make_user(role=UserRole.admin)
    token = create_access_token({"sub": admin.email}, expires_delta=timedelta(seconds=-1))
    response = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_protected_endpoint_rejects_a_token_for_an_unknown_user(client):
    token = jwt.encode({"sub": "ghost@example.com"}, SECRET_KEY, algorithm=ALGORITHM)
    response = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
