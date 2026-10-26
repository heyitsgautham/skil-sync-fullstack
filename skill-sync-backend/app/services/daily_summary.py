"""The daily applicant summary email a company receives, shared by the API and the scheduled script."""

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Application, Internship, User
from app.services.email_service import email_service


@dataclass
class DailySummary:
    internship_summaries: list[dict]
    total_applications: int
    html: str
    text: str
    subject: str


def summary_recipient(company: User) -> str:
    """The company's mailing email, which the profile page describes as where summaries go, else its login."""
    return company.mailing_email or company.email


def _applicant(student: User, application: Application) -> dict:
    skills = student.skills or []
    strengths = []
    if skills:
        strengths.append(f"Proficient in {', '.join(skills[:3])}")
    if student.total_experience_years:
        years = student.total_experience_years
        strengths.append(f"{years} years experience" if skills else f"{years} years of experience")
    return {
        "name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "match_score": application.match_score or application.application_similarity_score or 0,
        "top_skills": skills[:5],
        "experience_years": student.total_experience_years,
        "applied_at": application.created_at.strftime("%b %d, %Y at %I:%M %p"),
        "key_strengths": ", ".join(strengths) or "Details available in dashboard",
    }


def build_daily_summary(
    db: Session, company: User, hours: int = 24, now: datetime | None = None
) -> DailySummary | None:
    """Group the applications to a company's active internships from the last `hours` hours.

    Returns None when the company has no active internships. A summary with no applicants is still
    returned, so a preview can show that nothing came in.
    """
    now = now or datetime.utcnow()
    internships = db.query(Internship).filter(Internship.company_id == company.id, Internship.is_active == 1).all()
    if not internships:
        return None

    recent = (
        db.query(Application)
        .filter(
            Application.internship_id.in_([internship.id for internship in internships]),
            Application.created_at >= now - timedelta(hours=hours),
        )
        .order_by(Application.created_at.desc())
        .all()
    )

    summaries = []
    for internship in internships:
        applicants = []
        for application in (app for app in recent if app.internship_id == internship.id):
            student = db.get(User, application.student_id)
            if student is not None:
                applicants.append(_applicant(student, application))
        if applicants:
            summaries.append({"internship_title": internship.title, "applicants": applicants})

    total = sum(len(summary["applicants"]) for summary in summaries)
    return DailySummary(
        internship_summaries=summaries,
        total_applications=total,
        html=email_service.generate_daily_summary_html(
            company_name=company.full_name, internship_summaries=summaries, date=now
        ),
        text=email_service.generate_daily_summary_text(
            company_name=company.full_name, internship_summaries=summaries, date=now
        ),
        subject=f"SkillSync Daily Summary - {total} New Application(s) - {now.strftime('%b %d, %Y')}",
    )


def send_daily_summary(company: User, summary: DailySummary) -> bool:
    return email_service.send_email(
        to_email=summary_recipient(company),
        subject=summary.subject,
        html_content=summary.html,
        text_content=summary.text,
    )
