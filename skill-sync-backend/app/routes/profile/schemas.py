"""Request and response models for /api/profile."""

from pydantic import BaseModel


# Pydantic schemas
class StudentProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    skills: list | None = None
    total_experience_years: float | None = None

    class Config:
        from_attributes = True


class CompanyProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str  # Company name
    hr_contact_name: str | None = None
    mailing_email: str | None = None
    phone: str | None = None
    phone_visible: bool = False

    class Config:
        from_attributes = True


class StudentProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None


class CompanyProfileUpdate(BaseModel):
    full_name: str | None = None  # Company name
    hr_contact_name: str | None = None
    email: str | None = None
    mailing_email: str | None = None
    phone: str | None = None
    phone_visible: bool | None = None


class JobEmailStats(BaseModel):
    internship_id: int
    internship_title: str
    total_applicants: int  # Actually total candidates (all matches)
    great_matches: int  # 80%+
    good_matches: int  # 60-79%
    bad_matches: int  # <60%
    tailored_resume_count: int
