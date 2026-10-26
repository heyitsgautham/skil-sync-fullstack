"""
Email Notification Routes - Handle email notification endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import User, UserRole
from app.services.daily_summary import build_daily_summary, summary_recipient
from app.services.daily_summary import send_daily_summary as send_summary_email
from app.utils.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class DailySummaryResponse(BaseModel):
    """Response model for daily summary generation"""

    success: bool
    message: str
    total_applications: int
    internships_with_applications: int
    email_sent: bool
    preview_html: str | None = None


@router.post("/send-daily-summary", response_model=DailySummaryResponse)
def send_daily_summary(
    hours: int = 24,
    preview_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send daily summary of new applicants to company email (Manual trigger for demo)

    - **hours**: Number of hours to look back for applications (default: 24)
    - **preview_only**: If True, generates preview without sending email (default: False)

    This endpoint allows companies to manually trigger a daily summary email.
    In production, this would be scheduled to run automatically at midnight.

    Only companies can use this endpoint.
    """
    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can access daily summary reports"
        )

    summary = build_daily_summary(db, current_user, hours=hours)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active internship postings found")

    def respond(success: bool, message: str, email_sent: bool, preview_html: str | None = None):
        return DailySummaryResponse(
            success=success,
            message=message,
            total_applications=summary.total_applications,
            internships_with_applications=len(summary.internship_summaries),
            email_sent=email_sent,
            preview_html=preview_html,
        )

    # If preview only, return HTML without sending
    if preview_only:
        return respond(True, "Email preview generated successfully", False, summary.html)

    if not send_summary_email(current_user, summary):
        return respond(False, "Failed to send email. Please check email configuration.", False)

    return respond(True, f"Daily summary email sent successfully to {summary_recipient(current_user)}", True)


@router.get("/preview-daily-summary")
def preview_daily_summary(
    hours: int = 24, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Preview daily summary email without sending

    - **hours**: Number of hours to look back for applications (default: 24)

    Returns HTML preview of the daily summary email.
    Only companies can use this endpoint.
    """
    result = send_daily_summary(hours=hours, preview_only=True, db=db, current_user=current_user)

    return {
        "success": result.success,
        "message": result.message,
        "total_applications": result.total_applications,
        "internships_with_applications": result.internships_with_applications,
        "preview_html": result.preview_html,
    }
