"""Applying to an internship and listing a student's applications."""

import logging

from fastapi import Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Application, Internship, Resume, StudentInternshipMatch, User, UserRole
from app.routes.internship.common import router
from app.routes.internship.schemas import ApplicationResponse
from app.services.matching_engine import MatchingEngine
from app.services.rag_engine import rag_engine
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)


@router.post("/{internship_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_internship(
    internship_id: int,
    cover_letter: str | None = Form(None),
    use_tailored_resume: bool = Form(False),
    tailored_resume: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Apply to an internship (Student only) - Hybrid Matching Strategy

    This endpoint implements the full hybrid matching approach:
    1. Student can optionally upload a tailored resume for this specific application
    2. If tailored resume provided, calculates application_similarity_score with it
    3. If no tailored resume, uses active resume
    4. Falls back to pre-computed base_similarity if available
    5. Creates application record with hybrid scoring

    - **internship_id**: ID of the internship to apply to
    - **cover_letter**: Optional cover letter text
    - **use_tailored_resume**: Boolean flag to indicate if tailored resume should be used
    - **tailored_resume**: Optional file upload for tailored resume (PDF, DOCX, TXT)
    """
    import logging

    logger = logging.getLogger(__name__)

    # Only students can apply
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can apply to internships")

    # Check if internship exists and is active
    internship = db.query(Internship).filter(Internship.id == internship_id, Internship.is_active == 1).first()

    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found or no longer active")

    # Get student's active resume
    resume = db.query(Resume).filter(Resume.student_id == current_user.id, Resume.is_active == 1).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active resume found. Please upload a resume first."
        )

    # Check if already applied
    existing_application = (
        db.query(Application)
        .filter(Application.student_id == current_user.id, Application.internship_id == internship_id)
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You have already applied to this internship"
        )

    try:
        logger.info(f"Processing application for student {current_user.id} to internship {internship_id}")

        # Handle tailored resume if provided
        used_tailored = False
        resume_to_use = resume  # Default to active resume

        if use_tailored_resume and tailored_resume:
            logger.info("Processing tailored resume for application")
            try:
                from app.services.resume_service import ResumeService

                # Upload and process tailored resume
                tailored_resume_obj = await ResumeService.upload_and_process_resume(
                    file=tailored_resume,
                    student_id=current_user.id,
                    db=db,
                    is_tailored=True,
                    internship_id=internship_id,
                    base_resume_id=resume.id,
                    deactivate_others=False,  # Don't deactivate base resume
                )

                resume_to_use = tailored_resume_obj
                used_tailored = True
                logger.info(f"✅ Tailored resume processed successfully: ID {tailored_resume_obj.id}")

            except Exception as e:
                logger.error(f"⚠️ Error processing tailored resume: {str(e)}. Falling back to active resume.")
                # Fall back to active resume if tailored upload fails
                resume_to_use = resume
                used_tailored = False

        # Calculate application-specific similarity score
        matching_engine = MatchingEngine(rag_engine)

        # Prepare candidate data from resume (base or tailored)
        candidate_data = {
            'all_skills': resume_to_use.parsed_data.get('all_skills', []) if resume_to_use.parsed_data else [],
            'total_experience_years': resume_to_use.parsed_data.get('total_experience_years', 0)
            if resume_to_use.parsed_data
            else 0,
            'education': resume_to_use.parsed_data.get('education', []) if resume_to_use.parsed_data else [],
            'projects': resume_to_use.parsed_data.get('projects', []) if resume_to_use.parsed_data else [],
            'certifications': resume_to_use.parsed_data.get('certifications', []) if resume_to_use.parsed_data else [],
        }

        # Prepare internship data
        internship_data = {
            'required_skills': internship.required_skills or [],
            'preferred_skills': internship.preferred_skills or [],
            'min_experience': internship.min_experience or 0,
            'max_experience': internship.max_experience or 10,
            'required_education': internship.required_education or '',
        }

        # Embeddings live in ChromaDB under the resume and internship ids
        resume_chroma_id = (
            resume_to_use.embedding_id.replace('resume_', '') if resume_to_use.embedding_id else str(resume_to_use.id)
        )
        candidate_embedding = rag_engine.get_resume_embedding(resume_chroma_id)
        internship_embedding = rag_engine.get_internship_embedding(str(internship.id))

        # Without both embeddings the engine refuses to score, so the application
        # falls back to the pre-computed base similarity below.
        try:
            match_result = matching_engine.calculate_match_score(
                candidate_data=candidate_data,
                internship_data=internship_data,
                candidate_embedding=candidate_embedding,
                internship_embedding=internship_embedding,
            )
            application_similarity = int(match_result['overall_score'])
        except ValueError:
            logger.warning(f"No embeddings for resume {resume_to_use.id} or internship {internship.id}")
            application_similarity = 0
        logger.info(
            f"Calculated application similarity: {application_similarity}% (using {'tailored' if used_tailored else 'active'} resume)"
        )

        # Try to get pre-computed base similarity as fallback/comparison
        base_match = (
            db.query(StudentInternshipMatch)
            .filter(
                StudentInternshipMatch.student_id == current_user.id,
                StudentInternshipMatch.internship_id == internship_id,
            )
            .first()
        )

        # Use application similarity as primary, base as fallback
        final_match_score = application_similarity
        if base_match and application_similarity == 0:
            final_match_score = int(base_match.base_similarity_score)
            logger.info(f"Using pre-computed base similarity: {final_match_score}%")

        # Create application with tailored resume support
        new_application = Application(
            student_id=current_user.id,
            internship_id=internship_id,
            resume_id=resume_to_use.id,  # Use tailored resume ID if provided
            cover_letter=cover_letter,
            match_score=final_match_score,
            application_similarity_score=application_similarity,
            used_tailored_resume=1 if used_tailored else 0,  # Track if tailored resume was used
        )

        db.add(new_application)
        db.commit()
        db.refresh(new_application)

        logger.info(f"✅ Application created successfully: ID {new_application.id}")

        return ApplicationResponse(
            id=new_application.id,
            student_id=new_application.student_id,
            internship_id=new_application.internship_id,
            resume_id=new_application.resume_id,
            status=new_application.status,
            match_score=new_application.match_score,
            application_similarity_score=new_application.application_similarity_score,
            used_tailored_resume=new_application.used_tailored_resume,
            created_at=str(new_application.created_at),
        )

    except Exception as e:
        import traceback

        logger.error(f"  Error creating application: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating application: {str(e)}"
        )


@router.get("/applications/my-applications", response_model=list[ApplicationResponse])
def get_my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all applications for the current student
    """
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can view their applications")

    applications = (
        db.query(Application)
        .filter(Application.student_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )

    return [
        ApplicationResponse(
            id=app.id,
            student_id=app.student_id,
            internship_id=app.internship_id,
            resume_id=app.resume_id,
            status=app.status,
            match_score=app.match_score,
            application_similarity_score=app.application_similarity_score,
            used_tailored_resume=app.used_tailored_resume,
            created_at=str(app.created_at),
        )
        for app in applications
    ]
