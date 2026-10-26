"""POST /api/filter/rank-candidates/{internship_id}."""

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.internship import Internship
from app.models.user import User
from app.routes.intelligent_filtering.common import router
from app.routes.intelligent_filtering.ranking_applicants import rank_applicants
from app.routes.intelligent_filtering.ranking_discovery import rank_discovery
from app.utils.errors import internal_error
from app.utils.security import get_current_company


@router.post("/rank-candidates/{internship_id}")
async def rank_candidates_for_internship(
    internship_id: str,
    include_explanations: bool = True,
    limit: int = 50,
    only_applicants: bool = False,
    # Filter parameters
    min_match_score: float | None = Query(None, ge=0, le=100, description="Minimum match score percentage"),
    max_match_score: float | None = Query(None, ge=0, le=100, description="Maximum match score percentage"),
    min_experience: float | None = Query(None, ge=0, description="Minimum years of experience"),
    max_experience: float | None = Query(None, ge=0, description="Maximum years of experience"),
    filter_skills: str | None = Query(None, description="Comma-separated list of required skills"),
    education_level: str | None = Query(None, description="Minimum education level (Bachelor, Master, PhD)"),
    exclude_flagged: bool = Query(False, description="Exclude flagged candidates from results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_company),
):
    """
    Rank candidates for an internship using HYBRID MATCHING strategy with advanced filtering

    NEW HYBRID APPROACH (5-minute → seconds performance improvement):
    1. For APPLICANTS: Uses application_similarity_score (70% weight) + base_similarity (30% weight)
    2. For NON-APPLICANTS: Uses pre-computed base_similarity from student_internship_matches
    3. No real-time embedding computation needed - everything is pre-computed!

    Query Parameters:
    - **only_applicants**: If True, only ranks students who have already applied (FAST)
    - **limit**: Maximum number of candidates to return (default: 50)
    - **include_explanations**: Include detailed scoring breakdown (default: True)

    Filter Parameters (Slider-based filtering):
    - **min_match_score**: Minimum match percentage (0-100)
    - **max_match_score**: Maximum match percentage (0-100)
    - **min_experience**: Minimum years of experience
    - **max_experience**: Maximum years of experience
    - **required_skills**: Filter by specific skills (comma-separated)
    - **education_level**: Minimum education level (Bachelor, Master, PhD)
    - **exclude_flagged**: Exclude flagged candidates

    Scoring Components:
    - Application Similarity (70%): Score calculated when student applied
    - Base Similarity (30%): Pre-computed discovery score
    - Falls back to base_similarity if no application exists
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🔍 Ranking candidates for internship {internship_id} (only_applicants={only_applicants})")
        logger.info(f"🚩 exclude_flagged parameter: {exclude_flagged}")
        logger.info(
            f"🎯 Filter params: min_match={min_match_score}, max_match={max_match_score}, min_exp={min_experience}, max_exp={max_experience}"
        )

        # Get internship - try both internship_id (UUID) and id (integer) for compatibility
        internship = db.query(Internship).filter(Internship.internship_id == internship_id).first()
        if not internship:
            # Try integer ID as fallback
            try:
                int_id = int(internship_id)
                internship = db.query(Internship).filter(Internship.id == int_id).first()
            except ValueError:
                pass

        if not internship:
            raise HTTPException(status_code=404, detail="Internship not found")

        # Verify ownership
        if internship.company_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this internship")

        # HYBRID APPROACH: Use both base and tailored resumes for comprehensive ranking
        if only_applicants:
            return rank_applicants(
                db=db,
                internship=internship,
                current_user=current_user,
                limit=limit,
                include_explanations=include_explanations,
                min_match_score=min_match_score,
                max_match_score=max_match_score,
                min_experience=min_experience,
                max_experience=max_experience,
                filter_skills=filter_skills,
                education_level=education_level,
                exclude_flagged=exclude_flagged,
                logger=logger,
            )
        return rank_discovery(
            db=db,
            internship=internship,
            current_user=current_user,
            limit=limit,
            include_explanations=include_explanations,
            min_match_score=min_match_score,
            max_match_score=max_match_score,
            min_experience=min_experience,
            max_experience=max_experience,
            filter_skills=filter_skills,
            education_level=education_level,
            exclude_flagged=exclude_flagged,
            logger=logger,
        )

    except HTTPException:
        raise
    except Exception:
        raise internal_error("Error ranking candidates")
