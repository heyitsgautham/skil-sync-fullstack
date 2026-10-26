"""Browsing internships: the public list, a company's own posts and a student's matches."""

import logging

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Application, Internship, Resume, User, UserRole
from app.routes.internship.common import router
from app.routes.internship.schemas import InternshipResponse, InternshipWithMatchScore
from app.services.rag_engine import rag_engine
from app.utils.errors import internal_error
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)


@router.get("/list", response_model=list[InternshipResponse])
def list_internships(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    List all active internships (public endpoint, no authentication required)

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    internships = db.query(Internship).filter(Internship.is_active == 1).offset(skip).limit(limit).all()

    # Add company name to each internship
    result = []
    for internship in internships:
        internship_dict = {
            "id": internship.id,
            "company_id": internship.company_id,
            "company_name": internship.company.full_name if internship.company else "Unknown Company",
            "title": internship.title,
            "description": internship.description,
            "required_skills": internship.required_skills,
            "preferred_skills": internship.preferred_skills,
            "location": internship.location,
            "duration": internship.duration,
            "stipend": internship.stipend,
            "min_experience": internship.min_experience,
            "max_experience": internship.max_experience,
            "required_education": internship.required_education,
            "is_active": internship.is_active,
            "created_at": internship.created_at,
        }
        result.append(internship_dict)

    return result


@router.get("/my-posts", response_model=list[InternshipResponse])
def get_my_internships(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all internships posted by current company
    """
    if current_user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can view their posts")

    internships = (
        db.query(Internship)
        .filter(Internship.company_id == current_user.id)
        .order_by(Internship.created_at.desc())
        .all()
    )

    # Add company name and internship_id to each internship
    result = []
    for internship in internships:
        internship_dict = {
            "id": internship.id,
            "internship_id": internship.internship_id,  # Include UUID for intelligent filtering
            "company_id": internship.company_id,
            "company_name": current_user.full_name,
            "title": internship.title,
            "description": internship.description,
            "required_skills": internship.required_skills,
            "preferred_skills": internship.preferred_skills,
            "location": internship.location,
            "duration": internship.duration,
            "stipend": internship.stipend,
            "min_experience": internship.min_experience,
            "max_experience": internship.max_experience,
            "required_education": internship.required_education,
            "is_active": internship.is_active,
            "created_at": internship.created_at,
        }
        result.append(internship_dict)

    return result


@router.get("/match", response_model=list[InternshipWithMatchScore])
def match_internships(top_k: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get AI-powered internship recommendations based on student's resume

    - **top_k**: Number of recommendations to return (default: 10, max: 50)
    - Uses RAG engine to find best matching internships based on resume embeddings
    - Requires student to have an active resume uploaded
    """
    import logging

    logger = logging.getLogger(__name__)

    logger.info(f"Match internships called by user_id={current_user.id}, role={current_user.role}, top_k={top_k}")

    # Only students can get recommendations
    if current_user.role != UserRole.student:
        logger.warning(f"Non-student user {current_user.id} tried to access recommendations")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only students can get internship recommendations"
        )

    # Validate top_k parameter
    if top_k < 1 or top_k > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="top_k must be between 1 and 50")

    # Get student's active resume

    resume = db.query(Resume).filter(Resume.student_id == current_user.id, Resume.is_active == 1).first()

    if not resume:
        logger.warning(f"Student {current_user.id} has no active resume")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active resume found. Please upload a resume first to get personalized recommendations.",
        )

    logger.info(f"Found active resume {resume.id} for student {current_user.id}")
    logger.info(
        f"Resume details - ID: {resume.id}, file_name: {resume.file_name}, is_active: {resume.is_active}, embedding_id: {resume.embedding_id}"
    )

    try:
        # Get matching internships from RAG engine
        resume_id_str = str(resume.id)
        logger.info(f"Calling RAG engine to find matches for resume_id: {resume_id_str} (type: {type(resume_id_str)})")
        matches = rag_engine.find_matching_internships(resume_id=resume_id_str, top_k=top_k)

        logger.info(f"RAG engine returned {len(matches) if matches else 0} matches")

        if not matches:
            logger.info("No matches found, returning empty list")
            return []

        # Fetch full internship details
        internship_ids = [int(m['internship_id']) for m in matches]
        logger.info(f"Fetching details for internship IDs: {internship_ids}")

        internships = db.query(Internship).filter(Internship.id.in_(internship_ids), Internship.is_active == 1).all()

        logger.info(f"Found {len(internships)} active internships in database")

        # Create mapping of internship_id to internship
        internship_map = {str(i.id): i for i in internships}

        # Get all applications for this student to check which internships they've applied to
        applications = (
            db.query(Application)
            .filter(Application.student_id == current_user.id, Application.internship_id.in_(internship_ids))
            .all()
        )

        # Create mapping of internship_id to application (with resume info)
        application_map = {}
        for app in applications:
            # Get the resume used for this application
            app_resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
            application_map[app.internship_id] = {
                'has_applied': True,
                'resume_name': app_resume.file_name if app_resume else None,
            }

        # Combine data with match scores
        recommendations = []
        for match in matches:
            internship = internship_map.get(match['internship_id'])
            if internship:
                # Check if student has applied to this internship
                app_info = application_map.get(internship.id, {'has_applied': False, 'resume_name': None})

                # Convert to dict and add match_score
                internship_dict = {
                    "id": internship.id,
                    "company_id": internship.company_id,
                    "company_name": internship.company.full_name if internship.company else "Unknown Company",
                    "title": internship.title,
                    "description": internship.description,
                    "required_skills": internship.required_skills or [],
                    "preferred_skills": internship.preferred_skills or [],
                    "location": internship.location or "",
                    "duration": internship.duration or "",
                    "stipend": internship.stipend or "",
                    "is_active": internship.is_active,
                    "created_at": internship.created_at,
                    "match_score": match['match_score'],
                    "has_applied": app_info['has_applied'],
                    "application_resume_name": app_info['resume_name'],
                }
                recommendations.append(InternshipWithMatchScore(**internship_dict))
            else:
                logger.warning(f"Internship {match['internship_id']} not found in database")

        logger.info(f"Returning {len(recommendations)} recommendations")
        return recommendations

    except Exception:
        raise internal_error("Error generating recommendations")
