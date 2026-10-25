"""Write the demo accounts, internships and resumes into a database session.

Every step skips an email that already exists, so running the seed twice adds nothing the second time.
"""

import secrets
from dataclasses import dataclass, field
from pathlib import Path

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import User, UserRole

from .companies import COMPANIES
from .generated_students import STUDENTS_DATA, create_resume_content
from .profile_students import PROFILE_RESUMES, PROFILE_STUDENTS

BACKEND_ROOT = Path(__file__).resolve().parents[2]
RESUME_DIR = BACKEND_ROOT / "app" / "public" / "resumes"
# Resume.file_path holds paths relative to the backend root, the same form resume uploads store.
RESUME_PATH_PREFIX = "app/public/resumes"

ADMIN_EMAIL = "admin@skillsync.com"
MIN_PASSWORD_LENGTH = 8


def choose_password(environ):
    """Return SEED_PASSWORD when set, or a fresh random password, and whether it was generated.

    Seeded accounts never share a password that is written down in the repository.
    """
    password = environ.get("SEED_PASSWORD", "")
    if password:
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"SEED_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters")
        return password, False
    return secrets.token_urlsafe(12), True


@dataclass
class SeedSummary:
    created: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    internships: int = 0


def _exists(db, email):
    return db.query(User).filter(User.email == email).first() is not None


def _add_user(db, summary, email, full_name, role, password_hash):
    if _exists(db, email):
        summary.skipped.append(email)
        return None
    user = User(email=email, hashed_password=password_hash, full_name=full_name, role=role, is_active=1)
    db.add(user)
    db.flush()
    summary.created.append(email)
    return user


def _add_resume(db, student, file_name, content, skills, resume_dir):
    resume_dir.mkdir(parents=True, exist_ok=True)
    (resume_dir / file_name).write_text(content)
    db.add(
        Resume(
            student_id=student.id,
            file_path=f"{RESUME_PATH_PREFIX}/{file_name}",
            file_name=file_name,
            parsed_content=content,
            extracted_skills=skills,
            is_active=1,
        )
    )


def seed(db, password_hash, resume_dir=None):
    """Create the admin, 3 companies with 3 internships each, and 53 students with resumes."""
    resume_dir = Path(resume_dir) if resume_dir else RESUME_DIR
    summary = SeedSummary()

    _add_user(db, summary, ADMIN_EMAIL, "System Administrator", UserRole.admin, password_hash)

    for company_data in COMPANIES:
        company = _add_user(
            db, summary, company_data["email"], company_data["full_name"], UserRole.company, password_hash
        )
        if company is None:
            continue
        for internship_data in company_data["internships"]:
            db.add(Internship(company_id=company.id, **internship_data, is_active=1))
            summary.internships += 1

    for profile in PROFILE_STUDENTS:
        student = _add_user(db, summary, profile["email"], profile["full_name"], UserRole.student, password_hash)
        if student is not None:
            file_name = f"{profile['resume_key']}_resume.txt"
            content = PROFILE_RESUMES[profile["resume_key"]]
            _add_resume(db, student, file_name, content, profile["skills"], resume_dir)

    for student_data in STUDENTS_DATA:
        student = _add_user(db, summary, student_data["email"], student_data["name"], UserRole.student, password_hash)
        if student is not None:
            file_name = f"{student_data['name'].lower().replace(' ', '_')}_resume.txt"
            content = create_resume_content(student_data)
            _add_resume(db, student, file_name, content, student_data["skills"], resume_dir)

    db.commit()
    return summary
