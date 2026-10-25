"""Job report emails a company sends itself: per-job stats and the send endpoint."""

from datetime import datetime

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Application, Internship, User, UserRole
from app.models.student_internship_match import StudentInternshipMatch
from app.routes.profile.common import router
from app.routes.profile.job_email_content import generate_job_email_html, generate_job_email_text
from app.routes.profile.job_email_exports import generate_csv_export_from_matches, generate_excel_export_from_matches
from app.services.email_service import email_service
from app.utils.security import get_current_user


@router.get("/job-email-stats")
def get_job_email_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get email statistics for all company's jobs
    Used for the "Send Email" button dropdown

    Only accessible by companies
    """
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can access job email statistics"
        )

    # Get all internships for this company
    internships = db.query(Internship).filter(Internship.company_id == current_user.id, Internship.is_active == 1).all()

    stats_list = []
    total_stats = {
        "total_applicants": 0,
        "great_matches": 0,
        "good_matches": 0,
        "bad_matches": 0,
        "tailored_resume_count": 0,
    }

    for internship in internships:
        # Get ALL matched candidates for this internship (not just applicants)
        all_matches = (
            db.query(StudentInternshipMatch).filter(StudentInternshipMatch.internship_id == internship.id).all()
        )

        # Get applications to track tailored resumes
        applications = db.query(Application).filter(Application.internship_id == internship.id).all()

        great_matches = 0
        good_matches = 0
        bad_matches = 0
        tailored_count = 0

        # Count match quality for ALL candidates
        for match in all_matches:
            score = match.base_similarity_score or 0

            if score >= 80:
                great_matches += 1
            elif score >= 60:
                good_matches += 1
            else:
                bad_matches += 1

        # Count tailored resumes from applications
        for app in applications:
            if app.used_tailored_resume == 1:
                tailored_count += 1

        job_stats = {
            "internship_id": internship.id,
            "internship_title": internship.title,
            "total_applicants": len(all_matches),  # Changed to ALL candidates
            "great_matches": great_matches,
            "good_matches": good_matches,
            "bad_matches": bad_matches,
            "tailored_resume_count": tailored_count,
        }

        stats_list.append(job_stats)

        # Add to totals
        total_stats["total_applicants"] += len(all_matches)
        total_stats["great_matches"] += great_matches
        total_stats["good_matches"] += good_matches
        total_stats["bad_matches"] += bad_matches
        total_stats["tailored_resume_count"] += tailored_count

    return {"jobs": stats_list, "all_jobs_stats": total_stats}


@router.post("/send-job-email/{internship_id}")
def send_job_email(
    internship_id: int,
    filters: list[str] = Query(
        default=["great", "good", "other"],
        description="Match quality filters: great (≥80%), good (60-79%), other (<60%)",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send email with CSV, Excel, and summary for a specific job

    - **internship_id**: ID of the internship (use 0 for all jobs)
    - **filters**: List of match quality filters (great=≥80%, good=60-79%, other=<60%)

    Only accessible by companies for their own jobs
    """
    if current_user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can send job emails")

    # Validate filters
    valid_filters = {"great", "good", "other"}
    filters = [f for f in filters if f in valid_filters]
    if not filters:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid filter must be provided (great, good, or other)",
        )

    # Get stats
    stats_response = get_job_email_stats(db=db, current_user=current_user)

    if internship_id == 0:
        # Send email for all jobs
        job_stats = stats_response["all_jobs_stats"]
        internship_title = "All Jobs"
        internship = None  # the exports read each match's own internship

        # Get ALL matched candidates for all company internships
        matches_query = (
            db.query(StudentInternshipMatch)
            .join(Internship)
            .filter(Internship.company_id == current_user.id, Internship.is_active == 1)
        )
    else:
        # Verify internship belongs to this company
        internship = (
            db.query(Internship)
            .filter(Internship.id == internship_id, Internship.company_id == current_user.id)
            .first()
        )

        if not internship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found or you don't have access"
            )

        # Find job stats
        job_stats = next((job for job in stats_response["jobs"] if job["internship_id"] == internship_id), None)

        if not job_stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="No applications found for this internship"
            )

        internship_title = internship.title

        # Get ALL matched candidates for this internship
        matches_query = db.query(StudentInternshipMatch).filter(StudentInternshipMatch.internship_id == internship_id)

    all_matches = matches_query.all()

    if not all_matches:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No candidates found")

    # Filter matches based on match quality filters
    filtered_matches = []
    for match in all_matches:
        score = match.base_similarity_score or 0

        if "great" in filters and score >= 80:
            filtered_matches.append(match)
        elif "good" in filters and 60 <= score < 80:
            filtered_matches.append(match)
        elif "other" in filters and score < 60:
            filtered_matches.append(match)

    if not filtered_matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No candidates found matching the selected filters: {', '.join(filters)}",
        )

    # Generate CSV content from filtered matched candidates
    csv_content = generate_csv_export_from_matches(filtered_matches, db, internship)

    # Update job_stats to reflect filtered counts
    filtered_stats = {
        "total_applicants": len(filtered_matches),
        "great_matches": sum(1 for m in filtered_matches if (m.base_similarity_score or 0) >= 80),
        "good_matches": sum(1 for m in filtered_matches if 60 <= (m.base_similarity_score or 0) < 80),
        "bad_matches": sum(1 for m in filtered_matches if (m.base_similarity_score or 0) < 60),
        "tailored_resume_count": job_stats.get("tailored_resume_count", 0),
    }

    # Generate email HTML with filtered data
    html_content = generate_job_email_html(
        company_name=current_user.full_name,
        internship_title=internship_title,
        job_stats=filtered_stats,
        matches=filtered_matches,
        db=db,
        applied_filters=filters,
    )

    text_content = generate_job_email_text(
        company_name=current_user.full_name, internship_title=internship_title, job_stats=filtered_stats
    )

    # Generate Excel content from filtered matches
    excel_content = generate_excel_export_from_matches(filtered_matches, db, internship)

    # Send email with CSV and Excel attachments
    filter_label = ", ".join([f.upper() for f in filters])
    subject = f"SkillSync Job Report: {internship_title} - {len(filtered_matches)} Candidates ({filter_label})"

    # Use mailing_email if set, otherwise fallback to regular email
    recipient_email = current_user.mailing_email or current_user.email

    # Create filenames with matching timestamp

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"SkillSync_Candidates_{internship_title.replace(' ', '_')}_{timestamp}.csv"
    xlsx_filename = f"SkillSync_Candidates_{internship_title.replace(' ', '_')}_{timestamp}.xlsx"

    # Convert CSV string to bytes
    csv_bytes = csv_content.encode('utf-8')

    # Prepare attachments list (both CSV and Excel)
    attachments = [
        (csv_filename, csv_bytes, "text/csv"),
        (xlsx_filename, excel_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    ]

    email_sent = email_service.send_email(
        to_email=recipient_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        attachments=attachments,
    )

    if not email_sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")

    return {
        "success": True,
        "message": f"Email sent successfully to {recipient_email}",
        "internship_title": internship_title,
        "total_applicants": len(filtered_matches),
        "applied_filters": filters,
        "csv_preview": csv_content[:500] + "..." if len(csv_content) > 500 else csv_content,
    }
