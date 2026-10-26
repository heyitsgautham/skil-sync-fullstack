"""Tokens are never signed with a key that is published in this repository.

SECRET_KEY used to fall back to "your-secret-key-change-in-production", so a deployment that forgot
to set it accepted admin tokens anyone could forge with that string.
"""

import time

import jwt
import pytest

from app.models.user import UserRole
from app.utils import security
from app.utils.security import PUBLISHED_PLACEHOLDER_KEYS, signing_key


@pytest.mark.parametrize("value", [None, "", "   ", *sorted(PUBLISHED_PLACEHOLDER_KEYS)])
def test_unset_or_published_keys_become_a_random_key(value, caplog):
    environ = {} if value is None else {"SECRET_KEY": value}

    first = signing_key("SECRET_KEY", environ)
    second = signing_key("SECRET_KEY", environ)

    assert first != second
    assert len(first) >= 43
    assert first not in PUBLISHED_PLACEHOLDER_KEYS
    assert "SECRET_KEY" in caplog.text


def test_a_real_key_is_used_as_given():
    assert signing_key("SECRET_KEY", {"SECRET_KEY": "  4f9c2e7d1a  "}) == "4f9c2e7d1a"


def test_the_placeholders_cover_every_default_in_the_repo():
    assert {
        "your-secret-key-change-in-production",
        "replace-with-openssl-rand-hex-32",
        "replace-with-another-openssl-rand-hex-32",
        "local-dev-only-change-me",
        "local-dev-only-change-me-too",
    } <= PUBLISHED_PLACEHOLDER_KEYS


def test_a_token_forged_with_the_old_default_key_is_rejected(client, make_user):
    make_user(role=UserRole.admin, email="admin@skillsync.com")
    forged = jwt.encode(
        {"sub": "admin@skillsync.com", "role": "admin", "exp": int(time.time()) + 600},
        "your-secret-key-change-in-production",
        algorithm="HS256",
    )

    response = client.get("/api/auth/users", headers={"Authorization": f"Bearer {forged}"})

    assert response.status_code == 401
    assert security.SECRET_KEY != "your-secret-key-change-in-production"


def test_resume_links_are_signed_and_checked_with_the_same_key():
    from app.routes import recommendations, resume_view

    assert resume_view.TEMP_TOKEN_SECRET is security.TEMP_TOKEN_SECRET
    assert recommendations.TEMP_TOKEN_SECRET is security.TEMP_TOKEN_SECRET
    assert security.TEMP_TOKEN_SECRET not in PUBLISHED_PLACEHOLDER_KEYS
