"""Request and response models for /api/internship."""

from pydantic import BaseModel


class InternshipCreate(BaseModel):
    title: str
    description: str
    required_skills: list[str] | None = None
    preferred_skills: list[str] | None = None
    location: str | None = None
    duration: str | None = None
    stipend: str | None = None
    min_experience: float | None = None
    max_experience: float | None = None
    required_education: str | None = None


class SkillExtractionRequest(BaseModel):
    job_description: str


class SkillExtractionResponse(BaseModel):
    required_skills: list[str]
    preferred_skills: list[str]


class DocumentParseResponse(BaseModel):
    title: str
    description: str
    required_skills: list[str]
    preferred_skills: list[str]
    location: str | None = None
    duration: str | None = None
    stipend: str | None = None
    min_experience: float | None = 0
    max_experience: float | None = 5
    required_education: str | None = None
    start_date: str | None = None
    application_deadline: str | None = None
    company_info: str | None = None


class InternshipResponse(BaseModel):
    id: int
    company_id: int
    company_name: str | None = None
    title: str
    description: str
    required_skills: list[str] | None = None
    preferred_skills: list[str] | None = None
    location: str | None = None
    duration: str | None = None
    stipend: str | None = None
    min_experience: float | None = None
    max_experience: float | None = None
    required_education: str | None = None
    is_active: int

    class Config:
        from_attributes = True


class InternshipWithMatchScore(InternshipResponse):
    match_score: int | None = None
    has_applied: bool = False
    application_resume_name: str | None = None


class ApplicationCreate(BaseModel):
    cover_letter: str | None = None
    use_tailored_resume: bool = False  # NEW: Flag to indicate tailored resume usage


class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    internship_id: int
    resume_id: int
    status: str
    match_score: int | None = None
    application_similarity_score: int | None = None
    used_tailored_resume: int
    created_at: str
    # Filled in by GET /applications/my-applications so a student sees what they applied to
    internship_title: str | None = None
    company_name: str | None = None
    internship_location: str | None = None
    internship_is_active: bool | None = None

    class Config:
        from_attributes = True
