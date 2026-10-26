"""Validated types for the contact fields on a user: phone number, LinkedIn URL and GitHub URL.

Duplicate-candidate flagging compares these fields, and the ranking page turns the URLs into links,
so free text such as "call me maybe" or "not a url" must not reach the database.
A blank value means "no value" and becomes None, because the profile forms send "" for an empty field.
"""

import re
from typing import Annotated
from urllib.parse import urlparse

from pydantic import AfterValidator, BeforeValidator

_PHONE_CHARACTERS = re.compile(r"^\+?[\d\s().\-]+$")


def _blank_to_none(value):
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def _check_phone(value: str | None) -> str | None:
    if value is None:
        return None
    if len(value) > 50:
        raise ValueError("Phone number can be at most 50 characters")
    digits = sum(ch.isdigit() for ch in value)
    if not _PHONE_CHARACTERS.match(value) or not 7 <= digits <= 15:
        raise ValueError(
            "Phone number must have 7 to 15 digits, with only spaces, dashes, dots, brackets or a leading +"
        )
    return value


def _profile_url(site: str, domain: str):
    def check(value: str | None) -> str | None:
        if value is None:
            return None
        if len(value) > 500:
            raise ValueError(f"{site} URL can be at most 500 characters")
        if any(ch.isspace() for ch in value):
            raise ValueError(f"{site} URL cannot contain spaces")
        parsed = urlparse(value if "://" in value else f"https://{value}")
        host = (parsed.hostname or "").lower()
        if parsed.scheme not in ("http", "https") or not (host == domain or host.endswith(f".{domain}")):
            raise ValueError(f"{site} URL must be a {domain} address, such as https://{domain}/your-name")
        return value

    return check


# The length limits match the database columns
Phone = Annotated[str | None, BeforeValidator(_blank_to_none), AfterValidator(_check_phone)]
LinkedInUrl = Annotated[
    str | None,
    BeforeValidator(_blank_to_none),
    AfterValidator(_profile_url("LinkedIn", "linkedin.com")),
]
GitHubUrl = Annotated[
    str | None,
    BeforeValidator(_blank_to_none),
    AfterValidator(_profile_url("GitHub", "github.com")),
]
