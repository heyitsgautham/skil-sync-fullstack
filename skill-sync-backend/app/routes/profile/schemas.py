"""Request models for /api/profile."""

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field


def _blank_to_none(value):
    """The profile forms send "" for an empty field, which means "no value" rather than an invalid email."""
    if isinstance(value, str) and not value.strip():
        return None
    return value


# email-validator caps addresses at 254 characters, inside the 255-character column.
OptionalEmail = Annotated[EmailStr | None, BeforeValidator(_blank_to_none)]


class ProfileUpdate(BaseModel):
    """Body of PUT /api/profile/me.

    Every field is optional and only the fields sent are applied. Students may change full_name,
    phone, linkedin_url and github_url. Companies may change full_name, hr_contact_name, email,
    mailing_email, phone and phone_visible. Fields outside the caller's role are ignored.
    Lengths match the database columns.
    """

    model_config = ConfigDict(extra="ignore")

    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    hr_contact_name: str | None = Field(default=None, max_length=255)
    email: OptionalEmail = None
    mailing_email: OptionalEmail = None
    phone_visible: bool | None = None
