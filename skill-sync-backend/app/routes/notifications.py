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


class EmailPreviewRequest(BaseModel):
    """Request model for email preview"""

    hours: int = 24  # Number of hours to look back for applications


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


@router.get("/email-settings")
def get_email_settings(current_user: User = Depends(get_current_user)):
    """
    Get current email notification settings for the user

    Returns:
    - Email preferences (enabled/disabled)
    - Last email sent timestamp
    - Email delivery status

    Only authenticated users can access this endpoint.
    """
    # Placeholder for future email preferences implementation
    # Would store preferences in database

    return {
        "email": current_user.email,
        "daily_summary_enabled": True,  # Default enabled for companies
        "email_verified": True,  # Placeholder
        "last_email_sent": None,  # Would track in database
        "preferences": {"new_applications": True, "daily_summary": True, "weekly_report": False},
    }


@router.put("/email-settings")
def update_email_settings(
    daily_summary_enabled: bool = True,
    new_applications_enabled: bool = True,
    weekly_report_enabled: bool = False,
    current_user: User = Depends(get_current_user),
):
    """
    Update email notification preferences

    - **daily_summary_enabled**: Enable/disable daily summary emails
    - **new_applications_enabled**: Enable/disable immediate notifications for new applications
    - **weekly_report_enabled**: Enable/disable weekly analytics reports

    Only authenticated users can update their email settings.
    """
    # Placeholder for future email preferences implementation
    # Would update preferences in database

    return {
        "success": True,
        "message": "Email preferences updated successfully",
        "preferences": {
            "daily_summary": daily_summary_enabled,
            "new_applications": new_applications_enabled,
            "weekly_report": weekly_report_enabled,
        },
    }
