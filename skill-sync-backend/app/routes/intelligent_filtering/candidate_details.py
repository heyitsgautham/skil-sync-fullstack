"""Flagged candidate details, candidate profiles, single match scores and batch match computation."""

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.routes.intelligent_filtering.common import matching_engine, router
from app.services.candidate_flagging_service import CandidateFlaggingService
from app.services.rag_engine import rag_engine
from app.utils.errors import internal_error
from app.utils.security import get_current_company, get_current_user


@router.get("/flagged-candidates-details")
async def get_flagged_candidates_details(
    candidate_ids: str = Query(..., description="Comma-separated list of candidate IDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_company),
):
    """
    Get detailed information about flagged candidates for modal display

    Query Parameters:
    - candidate_ids: Comma-separated list of candidate IDs (e.g., "1,2,3")

    Returns:
    - List of candidate details including names, contact info, and flagging reasons
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        # Parse candidate IDs
        try:
            id_list = [int(id.strip()) for id in candidate_ids.split(',')]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid candidate IDs format")

        logger.info(f"🔍 Fetching details for flagged candidates: {id_list}")

        # Get candidate details
        candidates = db.query(User).filter(User.id.in_(id_list), User.role == UserRole.student).all()

        if not candidates:
            return {"success": True, "candidates": [], "message": "No candidates found"}

        # Get flagging info for these candidates
        flag_info = CandidateFlaggingService.get_flag_info_for_candidates(id_list, db)

        # Build response
        candidate_details = []
        for candidate in candidates:
            details = {
                'candidate_id': candidate.id,
                'candidate_name': candidate.full_name,
                'email': candidate.email,
                'phone': candidate.phone,
                'linkedin_url': candidate.linkedin_url,
                'github_url': candidate.github_url,
                'is_flagged': candidate.id in flag_info,
                'flag_reasons': flag_info.get(candidate.id, {}).get('reasons', []),
                'flagged_with': flag_info.get(candidate.id, {}).get('flagged_with', {}),
                'flag_reason_text': CandidateFlaggingService.format_flag_reason(
                    flag_info.get(candidate.id, {}).get('reasons', [])
                )
                if candidate.id in flag_info
                else None,
            }
            candidate_details.append(details)

        logger.info(f"✅ Retrieved details for {len(candidate_details)} candidates")

        return {"success": True, "candidates": candidate_details, "total_count": len(candidate_details)}

    except HTTPException:
        raise
    except Exception:
        raise internal_error("Error fetching candidate details")


@router.get("/candidate-profile/{student_id}")
async def get_detailed_candidate_profile(
    student_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_company)
):
    """
    Get detailed candidate profile with structured data

    Returns complete parsed resume data including:
    - Personal information
    - All skills (technical + soft)
    - Work experience with calculated durations
    - Education history
    - Projects and certifications
    - Professional summary
    """
    try:
        student = db.query(User).filter(User.user_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Candidate not found")

        resume = (
            db.query(Resume).filter(Resume.student_id == student.id, Resume.is_active == 1).first()
            or db.query(Resume).filter(Resume.student_id == student.id).first()
        )
        if not resume or not resume.parsed_data:
            raise HTTPException(status_code=404, detail="Resume data not found")

        return {
            "success": True,
            "candidate_id": student_id,
            "profile": resume.parsed_data,
            "metadata": {
                "resume_uploaded_at": resume.uploaded_at.isoformat() if hasattr(resume, 'uploaded_at') else None,
                "total_applications": db.query(Application).filter(Application.student_id == student.id).count(),
            },
        }

    except HTTPException:
        raise
    except Exception:
        raise internal_error("Error retrieving profile")


@router.post("/match-score")
async def calculate_match_score(
    student_id: str, internship_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Calculate match score between a specific candidate and internship

    Returns:
    - Overall match score (0-100)
    - Component scores breakdown
    - Matched and missing skills
    - Detailed explanation of the match
    """
    try:
        # Get student resume
        resume = db.query(Resume).filter(Resume.student_id == student_id).first()
        if not resume or not resume.parsed_data:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Get internship
        internship = db.query(Internship).filter(Internship.internship_id == internship_id).first()
        if not internship:
            raise HTTPException(status_code=404, detail="Internship not found")

        # Prepare data
        candidate_data = {
            'student_id': student_id,
            'all_skills': resume.parsed_data.get('all_skills', []),
            'total_experience_years': resume.parsed_data.get('total_experience_years', 0),
            'education': resume.parsed_data.get('education', []),
            'projects': resume.parsed_data.get('projects', []),
            'certifications': resume.parsed_data.get('certifications', []),
        }

        internship_data = {
            'title': internship.title,
            'description': internship.description,
            'required_skills': internship.required_skills or [],
            'preferred_skills': internship.preferred_skills or [],
            'min_experience': internship.min_experience or 0,
            'max_experience': internship.max_experience or 10,
            'required_education': internship.required_education or '',
        }

        # Get embeddings from ChromaDB
        # Note: get_resume_embedding expects ID without "resume_" prefix
        try:
            resume_chroma_id = resume.embedding_id.replace('resume_', '') if resume.embedding_id else str(resume.id)
            candidate_embedding = rag_engine.get_resume_embedding(resume_chroma_id) if resume.embedding_id else None
        except Exception:
            candidate_embedding = None

        try:
            internship_embedding = rag_engine.get_internship_embedding(str(internship.id))
        except Exception:
            # Fallback: generate embedding on-the-fly if not found in ChromaDB
            internship_embedding = rag_engine.generate_embedding(f"{internship.title} {internship.description}")

        # Calculate match score
        match_result = matching_engine.calculate_match_score(
            candidate_data=candidate_data,
            internship_data=internship_data,
            candidate_embedding=candidate_embedding,
            internship_embedding=internship_embedding,
        )

        # Generate explanation
        explanation = matching_engine.generate_match_explanation(
            candidate_data=candidate_data, internship_data=internship_data, match_result=match_result
        )

        return {
            "success": True,
            "student_id": student_id,
            "internship_id": internship_id,
            "match_result": match_result,
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception:
        raise internal_error("Error calculating match")


@router.post("/compute-matches")
async def compute_batch_similarity_matches(
    force_recompute: bool = False,
    student_id: int | None = None,
    internship_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    HYBRID MATCHING: Pre-compute base similarity scores for fast recommendations

    This endpoint triggers batch computation of similarity scores between students and internships.
    Results are stored in student_internship_matches table for instant retrieval.

    PERFORMANCE IMPACT:
    - After running this: Recommendations respond in 50-200ms (vs 5 minutes before)
    - Ranking candidates: Instant lookup from pre-computed scores
    - Only needs to run once, then incrementally after new uploads

    Use Cases:
    - Run after bulk student/internship imports
    - Schedule nightly for updated matches
    - Run after individual resume/internship upload

    Query Parameters:
    - **force_recompute**: Delete existing matches and recompute all (default: False)
    - **student_id**: Compute matches only for specific student (optional)
    - **internship_id**: Compute matches only for specific internship (optional)
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info("🚀 Starting batch similarity computation...")

        # Import batch matching service
        from app.services.batch_matching_service import BatchMatchingService

        batch_service = BatchMatchingService(db)

        # Compute matches based on parameters
        if student_id:
            logger.info(f"Computing matches for student {student_id}...")
            result = batch_service.compute_matches_for_student(student_id)
        elif internship_id:
            logger.info(f"Computing matches for internship {internship_id}...")
            result = batch_service.compute_matches_for_internship(internship_id)
        else:
            logger.info("Computing matches for ALL students and internships...")
            result = batch_service.compute_all_matches(force_recompute=force_recompute)

        return {
            "success": True,
            "message": "Batch similarity computation completed successfully!",
            "statistics": result,
            "performance_impact": {
                "recommendations_speedup": "5 minutes → 50-200ms",
                "ranking_speedup": "5 minutes → <1 second",
                "next_steps": [
                    "Test GET /recommendations/for-me (should be instant now)",
                    "Test POST /api/filter/rank-candidates (should use pre-computed scores)",
                    "Schedule this endpoint to run nightly for fresh matches",
                ],
            },
        }

    except Exception:
        raise internal_error("Error computing batch matches")
