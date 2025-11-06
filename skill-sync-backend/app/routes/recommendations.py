"""
Recommendations API Routes - AI-powered matching
"""

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database.connection import get_db
from app.models import User, Resume, Internship, UserRole
from app.services.rag_engine import rag_engine
from app.services.s3_service import s3_service
from app.services.match_explanation_service import get_match_explanation_service
from app.services.audit_service import get_audit_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# Pydantic schemas
class InternshipMatch(BaseModel):
    internship_id: int
    title: str
    description: str
    required_skills: List[str]
    location: str
    duration: str
    stipend: str
    match_score: int
    posted_date: Optional[str] = None
    experience_level: Optional[str] = None

class PaginatedInternshipResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[InternshipMatch]


class CandidateMatch(BaseModel):
    student_id: int
    student_name: str
    resume_id: int
    skills: List[str]
    match_score: int


@router.get("/for-me", response_model=PaginatedInternshipResponse)
def get_recommendations_for_student(
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    # Filtering
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum match score"),
    max_score: Optional[int] = Query(None, ge=0, le=100, description="Maximum match score"),
    skills: Optional[str] = Query(None, description="Comma-separated skills to filter"),
    location: Optional[str] = Query(None, description="Location filter"),
    experience_level: Optional[str] = Query(None, description="Experience level filter"),
    days_posted: Optional[int] = Query(None, ge=1, description="Filter by days since posted"),
    # Sorting
    sort_by: Optional[str] = Query("score", description="Sort by: score, date, title"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered internship recommendations with advanced filtering and pagination
    
    PERFORMANCE OPTIMIZATION:
    - Uses pre-computed base_similarity from student_internship_matches table
    - Response time: ~50-200ms with filtering and pagination
    
    Filtering Options:
    - **min_score/max_score**: Filter by match score range (0-100)
    - **skills**: Filter by required skills (comma-separated)
    - **location**: Filter by location
    - **experience_level**: Filter by experience level
    - **days_posted**: Filter internships posted within N days
    
    Sorting Options:
    - **sort_by**: score (default), date, title
    - **sort_order**: desc (default), asc
    
    Pagination:
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 100)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can get recommendations"
        )
    
    # Get student's active resume
    resume = db.query(Resume).filter(
        Resume.student_id == current_user.id,
        Resume.is_active == 1
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active resume found. Please upload a resume first."
        )
    
    logger.info(f"⚡ Getting recommendations with filters for student {current_user.id}")
    
    # HYBRID APPROACH: Query pre-computed matches with filtering
    from app.models.student_internship_match import StudentInternshipMatch
    
    # Build base query
    query = db.query(StudentInternshipMatch, Internship).join(
        Internship, StudentInternshipMatch.internship_id == Internship.id
    ).filter(
        StudentInternshipMatch.student_id == current_user.id,
        Internship.is_active == 1
    )
    
    # Apply filters
    filters = []
    
    # Score range filter
    if min_score is not None:
        filters.append(StudentInternshipMatch.base_similarity_score >= min_score)
    if max_score is not None:
        filters.append(StudentInternshipMatch.base_similarity_score <= max_score)
    
    # Skills filter (check if any of the specified skills are in required_skills)
    if skills:
        skill_list = [s.strip() for s in skills.split(',')]
        skill_filters = [func.json_contains(Internship.required_skills, f'"{skill}"') for skill in skill_list]
        filters.append(or_(*skill_filters))
    
    # Location filter
    if location:
        filters.append(Internship.location.ilike(f'%{location}%'))
    
    # Experience level filter
    if experience_level:
        filters.append(Internship.experience_level == experience_level)
    
    # Days posted filter
    if days_posted:
        cutoff_date = datetime.utcnow() - timedelta(days=days_posted)
        filters.append(Internship.created_at >= cutoff_date)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Apply sorting
    if sort_by == "score":
        if sort_order == "asc":
            query = query.order_by(StudentInternshipMatch.base_similarity_score.asc())
        else:
            query = query.order_by(StudentInternshipMatch.base_similarity_score.desc())
    elif sort_by == "date":
        if sort_order == "asc":
            query = query.order_by(Internship.created_at.asc())
        else:
            query = query.order_by(Internship.created_at.desc())
    elif sort_by == "title":
        if sort_order == "asc":
            query = query.order_by(Internship.title.asc())
        else:
            query = query.order_by(Internship.title.desc())
    else:
        # Default: sort by score descending
        query = query.order_by(StudentInternshipMatch.base_similarity_score.desc())
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    results = query.all()
    
    logger.info(f"✅ Found {total} total matches, returning page {page} ({len(results)} items)")
    
    # Build response
    recommendations = []
    for match, internship in results:
        recommendations.append(InternshipMatch(
            internship_id=internship.id,
            title=internship.title,
            description=internship.description,
            required_skills=internship.required_skills or [],
            location=internship.location or "",
            duration=internship.duration or "",
            stipend=internship.stipend or "",
            match_score=int(match.base_similarity_score),
            posted_date=internship.created_at.isoformat() if internship.created_at else None,
            experience_level=internship.experience_level
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedInternshipResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=recommendations
    )


@router.get("/candidates/{internship_id}", response_model=List[CandidateMatch])
def get_recommended_candidates(
    internship_id: int,
    top_k: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered candidate recommendations for an internship (Company only)
    
    - **internship_id**: ID of the internship
    - **top_k**: Number of candidates to return (default: 20)
    - Uses RAG engine to find best matching candidates
    """
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view candidate recommendations"
        )
    
    # Verify internship belongs to current company
    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.company_id == current_user.id
    ).first()
    
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found"
        )
    
    # Get matching candidates from RAG engine
    matches = rag_engine.find_matching_candidates(
        internship_id=str(internship_id),
        top_k=top_k
    )
    
    if not matches:
        return []
    
    # Fetch full resume and student details
    resume_ids = [int(m['resume_id']) for m in matches]
    resumes = db.query(Resume, User).join(
        User, Resume.student_id == User.id
    ).filter(
        Resume.id.in_(resume_ids),
        Resume.is_active == 1
    ).all()
    
    # Create mapping of resume_id to (resume, user)
    resume_map = {str(r.id): (r, u) for r, u in resumes}
    
    # Combine data with match scores
    recommendations = []
    for match in matches:
        data = resume_map.get(match['resume_id'])
        if data:
            resume, student = data
            recommendations.append(CandidateMatch(
                student_id=student.id,
                student_name=student.full_name,
                resume_id=resume.id,
                skills=match.get('skills', []),
                match_score=match['match_score']
            ))
    
    return recommendations


@router.get("/resume/{student_id}")
def get_candidate_resume_url(
    student_id: int,
    internship_id: Optional[int] = Query(None, description="Internship ID to verify access"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get presigned URL to view candidate's resume (Company only)
    
    - **student_id**: ID of the student/candidate
    - **internship_id**: Optional internship ID to verify company owns the internship
    - Returns presigned S3 URL (expires in 1 hour) or local file path
    - Tracks resume views for analytics
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view candidate resumes"
        )
    
    # If internship_id provided, verify company owns it
    if internship_id:
        internship = db.query(Internship).filter(
            Internship.id == internship_id,
            Internship.company_id == current_user.id
        ).first()
        
        if not internship:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this internship"
            )
    
    # Get student's active resume
    resume = db.query(Resume).filter(
        Resume.student_id == student_id,
        Resume.is_active == 1
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Generate presigned URL if S3 is enabled and resume is stored in S3
    if s3_service.is_enabled() and resume.s3_key:
        logger.info(f"📄 Generating presigned URL for resume: {resume.s3_key}")
        presigned_url = s3_service.generate_presigned_url(resume.s3_key, expiration=3600)
        
        if presigned_url:
            return {
                "resume_id": resume.id,
                "file_name": resume.file_name,
                "url": presigned_url,
                "storage_type": "s3",
                "expires_in": 3600,
                "message": "URL expires in 1 hour"
            }
        else:
            logger.warning(f"⚠️ Failed to generate presigned URL, falling back to local path")
    
    # Fallback to local file path
    if not os.path.exists(resume.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found"
        )
    
    # For local storage, return file path (frontend will need to handle this differently)
    return {
        "resume_id": resume.id,
        "file_name": resume.file_name,
        "file_path": resume.file_path,
        "storage_type": "local",
        "message": "Resume stored locally. Use appropriate endpoint to download."
    }


# ==========================================
# PHASE 4: ENHANCED EXPLAINABILITY ENDPOINTS
# ==========================================

@router.get("/candidates/{candidate_id}/explanation")
def get_candidate_explanation(
    candidate_id: int,
    internship_id: int = Query(..., description="Internship ID for match explanation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Task 4.1: Get comprehensive explainability for a candidate-internship match**
    
    Returns detailed explanation including:
    - Overall score, confidence, and recommendation badge
    - Component scores breakdown (semantic, skills, experience, education, projects)
    - Matched skills with proficiency, evidence snippets, and confidence
    - Missing skills with impact rating, reason, and mitigation recommendations
    - Experience timeline with relevant years calculation
    - Education match level analysis
    - Project highlights with evidence
    - AI-generated recommendation (strengths, concerns, interview questions)
    - Provenance metadata (model used, timestamp, data sources)
    - Audit ID (if logging enabled)
    
    **Access Control:**
    - Companies can only view explanations for their own internships
    - Admins can view all explanations
    
    **Example Response:**
    ```json
    {
      "candidate_id": 123,
      "internship_id": 456,
      "overall_score": 85.5,
      "confidence": 0.92,
      "recommendation": "SHORTLIST",
      "component_scores": {
        "semantic": 82.0,
        "skills": 88.0,
        "experience": 75.0,
        "education": 90.0,
        "projects": 85.0
      },
      "matched_skills": [
        {
          "skill": "React",
          "proficiency": "Advanced",
          "confidence": 0.95,
          "evidence": ["Built 3 production apps using React...", "..."]
        }
      ],
      "missing_skills": [
        {
          "skill": "Docker",
          "impact": "medium",
          "reason": "Not mentioned in resume",
          "recommendation": "Ask about containerization experience"
        }
      ],
      "experience_analysis": {
        "total_years": 2.5,
        "relevant_years": 2.0,
        "breakdown": [...]
      },
      "education_analysis": {
        "highest_degree": "Bachelor's",
        "match_level": "exact"
      },
      "project_analysis": [...],
      "ai_recommendation": {
        "action": "SHORTLIST",
        "priority": "High",
        "strengths": ["Strong React skills", "Relevant projects", "Good GPA"],
        "concerns": ["Limited Docker experience", "No CI/CD pipeline work"],
        "interview_questions": ["...", "...", "..."],
        "justification": "Candidate shows strong technical skills..."
      },
      "provenance": {
        "extraction_model": "gemini-2.5-flash",
        "extract_time": "2025-11-06T10:30:00",
        "data_sources": ["resume", "internship_posting"],
        "llm_model": "gemini-2.5-flash"
      },
      "explanation_id": "uuid-here",
      "created_at": "2025-11-06T10:30:00"
    }
    ```
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Verify access permissions
    if current_user.role == UserRole.company:
        # Verify internship belongs to current company
        internship = db.query(Internship).filter(
            Internship.id == internship_id,
            Internship.company_id == current_user.id
        ).first()
        
        if not internship:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this internship"
            )
    elif current_user.role == UserRole.student:
        # Students can only view their own explanations
        if candidate_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own explanations"
            )
    # Admins have full access
    
    logger.info(f"🔍 Fetching explanation for candidate {candidate_id} x internship {internship_id}")
    
    # Check if explanation already exists in cache
    from app.models.explainability import CandidateExplanation
    
    cached_explanation = db.query(CandidateExplanation).filter(
        CandidateExplanation.candidate_id == candidate_id,
        CandidateExplanation.internship_id == internship_id
    ).order_by(CandidateExplanation.created_at.desc()).first()
    
    # Use cached if it exists and is recent (within 24 hours)
    if cached_explanation:
        from datetime import timedelta, timezone
        age = datetime.now(timezone.utc) - cached_explanation.created_at
        
        if age < timedelta(hours=24):
            logger.info(f"✅ Using cached explanation (age: {age.total_seconds()/3600:.1f} hours)")
            
            # Build response from cached data
            explanation_response = {
                'explanation_id': cached_explanation.explanation_id,
                'candidate_id': cached_explanation.candidate_id,
                'internship_id': cached_explanation.internship_id,
                'overall_score': cached_explanation.overall_score,
                'confidence': cached_explanation.confidence,
                'recommendation': cached_explanation.recommendation,
                'component_scores': cached_explanation.component_scores,
                'matched_skills': cached_explanation.matched_skills,
                'missing_skills': cached_explanation.missing_skills,
                'experience_analysis': cached_explanation.experience_analysis,
                'education_analysis': cached_explanation.education_analysis,
                'project_analysis': cached_explanation.project_analysis,
                'ai_recommendation': cached_explanation.ai_recommendation,
                'provenance': cached_explanation.provenance,
                'created_at': cached_explanation.created_at.isoformat(),
                'updated_at': cached_explanation.updated_at.isoformat() if cached_explanation.updated_at else None
            }
            
            return explanation_response
    
    # Generate new explanation
    logger.info("🔄 Generating new explanation...")
    match_explanation_service = get_match_explanation_service()
    
    explanation = match_explanation_service.generate_explanation(
        candidate_id=candidate_id,
        internship_id=internship_id,
        db_session=db
    )
    
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate explanation. Please check if candidate and internship data are complete."
        )
    
    logger.info(f"✅ Explanation generated successfully (score: {explanation['overall_score']:.2f})")
    
    return explanation


@router.get("/internship/{internship_id}/compare")
def compare_candidates(
    internship_id: int,
    candidates: str = Query(..., description="Comma-separated candidate IDs (e.g., '123,456')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Task 4.2: Compare two candidates side-by-side for an internship**
    
    Returns comprehensive comparison including:
    - Side-by-side component scores
    - Aligned skill lists (matched vs missing)
    - Experience comparison (relevant years, project count)
    - Natural language "Why A > B" summary
    - Actionable next steps for each candidate
    - Audit log entry for this comparison
    
    **Access Control:**
    - Companies can only compare candidates for their own internships
    - Admins can compare any candidates
    
    **Query Parameters:**
    - `candidates`: Comma-separated list of exactly 2 candidate IDs (e.g., "123,456")
    
    **Example Response:**
    ```json
    {
      "internship_id": 456,
      "candidate_1": {
        "candidate_id": 123,
        "overall_score": 85.5,
        "recommendation": "SHORTLIST",
        "component_scores": {...},
        "matched_skills_count": 8,
        "missing_skills_count": 2,
        "experience_years": 2.5,
        "relevant_experience_years": 2.0
      },
      "candidate_2": {
        "candidate_id": 124,
        "overall_score": 78.0,
        "recommendation": "MAYBE",
        "component_scores": {...},
        "matched_skills_count": 6,
        "missing_skills_count": 4,
        "experience_years": 1.5,
        "relevant_experience_years": 1.0
      },
      "score_difference": 7.5,
      "better_candidate": 123,
      "component_differences": {
        "semantic": 5.0,
        "skills": 12.0,
        "experience": 8.0,
        "education": 0.0,
        "projects": 5.0
      },
      "summary": "Candidate 123 scores 7.5 points higher overall. The biggest difference is in skills (12.0 points). Candidate 123 matches 2 more required skills. Candidate 123 has 1.0 more years of relevant experience.",
      "next_steps": {
        "candidate_1": [
          "Schedule technical interview",
          "Request portfolio/GitHub review"
        ],
        "candidate_2": [
          "Conduct phone screening to assess skill gaps",
          "Request additional information on missing skills"
        ]
      }
    }
    ```
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Verify access permissions
    if current_user.role == UserRole.company:
        # Verify internship belongs to current company
        internship = db.query(Internship).filter(
            Internship.id == internship_id,
            Internship.company_id == current_user.id
        ).first()
        
        if not internship:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this internship"
            )
    elif current_user.role == UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot compare candidates"
        )
    # Admins have full access
    
    # Parse candidate IDs
    try:
        candidate_ids = [int(c.strip()) for c in candidates.split(',')]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate IDs format. Use comma-separated integers (e.g., '123,456')"
        )
    
    if len(candidate_ids) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exactly 2 candidate IDs must be provided for comparison"
        )
    
    candidate_id_1, candidate_id_2 = candidate_ids
    
    logger.info(f"📊 Comparing candidates {candidate_id_1} vs {candidate_id_2} for internship {internship_id}")
    
    # Generate comparison
    match_explanation_service = get_match_explanation_service()
    
    comparison = match_explanation_service.generate_comparison_explanation(
        candidate_id_1=candidate_id_1,
        candidate_id_2=candidate_id_2,
        internship_id=internship_id,
        db_session=db
    )
    
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate comparison. Please check if candidate and internship data are complete."
        )
    
    # Log comparison action in audit log
    try:
        audit_service = get_audit_service()
        audit_id = audit_service.create_audit_log(
            user_id=current_user.id,
            action="compare",
            internship_id=internship_id,
            candidate_ids=candidate_ids,
            filters_applied={},
            blind_mode=False,
            db_session=db
        )
        comparison['audit_id'] = audit_id
        logger.info(f"📝 Comparison logged with audit ID: {audit_id}")
    except Exception as e:
        logger.warning(f"⚠️  Failed to log comparison in audit: {e}")
        # Don't fail the request if audit logging fails
    
    logger.info(f"✅ Comparison generated (better: candidate {comparison['better_candidate']})")
    
    return comparison
