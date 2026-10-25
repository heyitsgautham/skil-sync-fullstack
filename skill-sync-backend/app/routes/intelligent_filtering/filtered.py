"""GET /api/filter/rank-candidates/{internship_id}/filtered."""

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import User
from app.routes.intelligent_filtering.common import router
from app.services.candidate_filters import experience_years, resume_matches
from app.utils.security import get_current_company


@router.get("/rank-candidates/{internship_id}/filtered")
async def get_filtered_ranked_candidates(
    internship_id: str,
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    # Filtering
    min_score: int | None = Query(None, ge=0, le=100, description="Minimum match score"),
    max_score: int | None = Query(None, ge=0, le=100, description="Maximum match score"),
    skills: str | None = Query(None, description="Comma-separated skills to filter"),
    experience_min: float | None = Query(None, ge=0, description="Minimum years of experience"),
    experience_max: float | None = Query(None, ge=0, description="Maximum years of experience"),
    education_level: str | None = Query(None, description="Education level filter"),
    application_status: str | None = Query(None, description="Filter by application status"),
    only_applicants: bool = Query(False, description="Show only students who applied"),
    # Sorting
    sort_by: str | None = Query("score", description="Sort by: score, experience, name, date"),
    sort_order: str | None = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_company),
):
    """
    Get filtered and paginated candidate rankings for an internship

    This endpoint provides advanced filtering, sorting, and pagination for candidate rankings.
    Uses pre-computed match scores for fast performance.

    Filtering Options:
    - **min_score/max_score**: Filter by match score range (0-100)
    - **skills**: Filter candidates with specific skills (comma-separated)
    - **experience_min/max**: Filter by years of experience range
    - **education_level**: Filter by education level
    - **application_status**: Filter by application status (pending, accepted, rejected)
    - **only_applicants**: Show only candidates who have applied

    Sorting Options:
    - **sort_by**: score (default), experience, name, date
    - **sort_order**: desc (default), asc

    Pagination:
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 100)
    """
    import logging

    from sqlalchemy import and_

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🔍 Getting filtered candidates for internship {internship_id}")

        from app.models.student_internship_match import StudentInternshipMatch

        # Get internship
        internship = db.query(Internship).filter(Internship.internship_id == internship_id).first()
        if not internship:
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

        # Build base query
        if only_applicants:
            # Join with applications table
            query = (
                db.query(StudentInternshipMatch, User, Resume, Application)
                .join(User, StudentInternshipMatch.student_id == User.id)
                .join(Resume, and_(Resume.student_id == User.id, Resume.is_active == 1))
                .join(Application, and_(Application.student_id == User.id, Application.internship_id == internship.id))
                .filter(
                    StudentInternshipMatch.internship_id == internship.id,
                    User.is_active == 1,  # Only show active students in rankings
                )
            )
        else:
            # All candidates with pre-computed matches
            query = (
                db.query(StudentInternshipMatch, User, Resume)
                .join(User, StudentInternshipMatch.student_id == User.id)
                .join(Resume, and_(Resume.student_id == User.id, Resume.is_active == 1))
                .filter(
                    StudentInternshipMatch.internship_id == internship.id,
                    User.is_active == 1,  # Only show active students in rankings
                )
            )

        # Apply filters
        filters = []

        # Score range filter
        if min_score is not None:
            filters.append(StudentInternshipMatch.base_similarity_score >= min_score)
        if max_score is not None:
            filters.append(StudentInternshipMatch.base_similarity_score <= max_score)

        # Experience filter
        if experience_min is not None or experience_max is not None:
            if experience_min is not None:
                filters.append(experience_years(Resume.parsed_data) >= experience_min)
            if experience_max is not None:
                filters.append(experience_years(Resume.parsed_data) <= experience_max)

        # Application status filter (only if filtering applicants)
        if only_applicants and application_status:
            filters.append(Application.status == application_status)

        if filters:
            query = query.filter(and_(*filters))

        # Apply sorting
        if sort_by == "score":
            if sort_order == "asc":
                query = query.order_by(StudentInternshipMatch.base_similarity_score.asc())
            else:
                query = query.order_by(StudentInternshipMatch.base_similarity_score.desc())
        elif sort_by == "experience":
            exp_field = experience_years(Resume.parsed_data)
            if sort_order == "asc":
                query = query.order_by(exp_field.asc())
            else:
                query = query.order_by(exp_field.desc())
        elif sort_by == "name":
            if sort_order == "asc":
                query = query.order_by(User.full_name.asc())
            else:
                query = query.order_by(User.full_name.desc())
        elif sort_by == "date" and only_applicants:
            if sort_order == "asc":
                query = query.order_by(Application.created_at.asc())
            else:
                query = query.order_by(Application.created_at.desc())
        else:
            # Default: sort by score descending
            query = query.order_by(StudentInternshipMatch.base_similarity_score.desc())

        # Skills and education live inside JSON lists, so they are checked in Python on the rows
        # the SQL filters already narrowed. Paging then happens on the checked rows.
        offset = (page - 1) * page_size
        if skills or education_level:
            matching = [row for row in query.all() if resume_matches(row[2].parsed_data, skills, education_level)]
            total = len(matching)
            results = matching[offset : offset + page_size]
        else:
            total = query.count()
            results = query.offset(offset).limit(page_size).all()

        logger.info(f"✅ Found {total} total candidates, returning page {page} ({len(results)} items)")

        # Build response
        ranked_candidates = []
        for row in results:
            match = row[0]
            user = row[1]
            resume = row[2]
            application = row[3] if only_applicants and len(row) > 3 else None

            parsed_data = resume.parsed_data or {}

            candidate = {
                'candidate_id': user.id,
                'candidate_name': user.full_name,
                'resume_id': resume.id,
                'email': user.email,
                'phone': parsed_data.get('personal_info', {}).get('phone'),
                'skills': parsed_data.get('all_skills', []),
                'total_experience_years': parsed_data.get('total_experience_years', 0),
                'education': parsed_data.get('education', []),
                'match_score': round(match.base_similarity_score, 2),
                'component_scores': {
                    'semantic_similarity': round(match.semantic_similarity, 2)
                    if match.semantic_similarity is not None
                    else None,
                    'skills_match': round(match.skills_match_score, 2)
                    if match.skills_match_score is not None
                    else None,
                    'experience_match': round(match.experience_match_score, 2)
                    if match.experience_match_score is not None
                    else None,
                },
                'application_status': application.status if application else 'not_applied',
                'applied_at': str(application.created_at) if application else None,
            }

            # Add match details
            required_skills = internship.required_skills or []
            candidate_skills = parsed_data.get('all_skills', [])
            matched_skills = [s for s in candidate_skills if s.lower() in [rs.lower() for rs in required_skills]]
            missing_skills = [s for s in required_skills if s.lower() not in [cs.lower() for cs in candidate_skills]]

            candidate['match_details'] = {
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'experience_gap': max(0, (internship.min_experience or 0) - candidate['total_experience_years']),
            }

            ranked_candidates.append(candidate)

        total_pages = (total + page_size - 1) // page_size

        return {
            "success": True,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "ranked_candidates": ranked_candidates,
            "internship": {
                "id": internship.id,
                "title": internship.title,
                "required_skills": internship.required_skills or [],
                "min_experience": internship.min_experience or 0,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        logger.error(f"  Error filtering candidates: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error filtering candidates: {str(e)}")
