"""
Internship API Routes
"""

import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models import User, Internship, UserRole, Resume, Application, StudentInternshipMatch
from app.services.parser_service import InternshipParser
from app.services.rag_engine import rag_engine
from app.services.matching_engine import MatchingEngine
from app.services.skill_extraction_service import get_skill_extraction_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/internship", tags=["Internship"])

# Pydantic schemas
class SkillExtractionRequest(BaseModel):
    title: str
    description: str
    num_suggestions: Optional[int] = 15


class ExtractedSkill(BaseModel):
    skill: str
    original_name: str
    category: str
    confidence: float
    span: List[int]
    in_taxonomy: bool


class SkillExtractionResponse(BaseModel):
    skills: List[ExtractedSkill]
    suggested_must_have: List[str]
    suggested_preferred: List[str]
    highlighted_html: str


class InternshipCreate(BaseModel):
    title: str
    description: str
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience: Optional[float] = 0.0
    max_experience: Optional[float] = 10.0
    preferred_years: Optional[float] = None
    required_education: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[str] = None
    
    # Job posting enhancement fields
    rubric_weights: Optional[dict] = None  # {semantic: 0.35, skills: 0.30, experience: 0.20, education: 0.10, projects: 0.05}
    skill_weights: Optional[List[dict]] = None  # [{skill: "React", weight: 1.0, type: "must"}, ...]
    top_responsibilities: Optional[List[str]] = None  # List of 3 key responsibilities
    key_deliverable: Optional[str] = None  # First 3-month deliverable description
    requires_portfolio: Optional[bool] = False
    role_level: Optional[str] = None  # Intern/Junior/Mid/Senior
    
    # AI skill extraction fields
    extracted_skills_raw: Optional[List[dict]] = None  # Raw AI-extracted skills before HR editing
    skills_extraction_confidence: Optional[dict] = None  # Confidence scores for each extracted skill


class InternshipResponse(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None
    title: str
    description: str
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    preferred_years: Optional[float] = None
    required_education: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[str] = None
    is_active: int
    
    # Job posting enhancement fields
    rubric_weights: Optional[dict] = None
    skill_weights: Optional[List[dict]] = None
    top_responsibilities: Optional[List[str]] = None
    key_deliverable: Optional[str] = None
    requires_portfolio: Optional[bool] = None
    role_level: Optional[str] = None
    extracted_skills_raw: Optional[List[dict]] = None
    skills_extraction_confidence: Optional[dict] = None
    
    class Config:
        from_attributes = True


class InternshipWithMatchScore(InternshipResponse):
    match_score: Optional[int] = None
    has_applied: bool = False
    application_resume_name: Optional[str] = None


@router.post("/extract-skills", response_model=SkillExtractionResponse)
def extract_skills_from_job_description(
    request: SkillExtractionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Extract skills from job description using AI (Company only)
    
    Uses Gemini AI to analyze the job title and description, extracting:
    - Technical and soft skills
    - Confidence scores for each skill
    - Text spans showing where skills appear
    - Auto-categorization into must-have and preferred skills
    
    Returns:
    - skills: List of extracted skills with metadata
    - suggested_must_have: Skills with confidence > 0.8
    - suggested_preferred: Skills with confidence 0.6-0.8
    - highlighted_html: HTML version of description with skills highlighted
    """
    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can use skill extraction"
        )
    
    try:
        # Get skill extraction service
        extraction_service = get_skill_extraction_service()
        
        # Extract skills
        extracted_skills = extraction_service.extract_skills_from_description(
            title=request.title,
            description=request.description,
            num_suggestions=request.num_suggestions
        )
        
        # Categorize into must-have and preferred
        categorized = extraction_service.categorize_extracted_skills(
            skills=extracted_skills,
            required_threshold=0.8
        )
        
        # Generate highlighted HTML
        highlighted_html = extraction_service.highlight_skills_in_text(
            description=request.description,
            extracted_skills=extracted_skills
        )
        
        return {
            "skills": extracted_skills,
            "suggested_must_have": categorized["must_have"],
            "suggested_preferred": categorized["preferred"],
            "highlighted_html": highlighted_html
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting skills: {str(e)}"
        )


@router.post("/post", response_model=InternshipResponse, status_code=status.HTTP_201_CREATED)
def post_internship(
    internship_data: InternshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Post a new internship (Company only)
    
    - **title**: Internship title
    - **description**: Detailed description
    - **required_skills**: List of required skills (auto-extracted if not provided)
    - **location**: Location (optional)
    - **duration**: Duration (optional)
    - **stipend**: Stipend information (optional)
    """
    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can post internships"
        )
    
    try:
        # Parse internship data to extract skills if not provided
        parsed_data = InternshipParser.parse_internship(internship_data.dict())
        
        # Validate rubric_weights if provided
        if internship_data.rubric_weights:
            weights = internship_data.rubric_weights
            total = sum([
                weights.get('semantic', 0),
                weights.get('skills', 0),
                weights.get('experience', 0),
                weights.get('education', 0),
                weights.get('projects', 0)
            ])
            if abs(total - 1.0) > 0.01:  # Allow small floating point errors
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Rubric weights must sum to 1.0, got {total}"
                )
        
        # Create internship record with all fields
        new_internship = Internship(
            company_id=current_user.id,
            title=parsed_data['title'],
            description=parsed_data['description'],
            required_skills=parsed_data.get('required_skills') or internship_data.required_skills,
            preferred_skills=internship_data.preferred_skills,
            min_experience=internship_data.min_experience,
            max_experience=internship_data.max_experience,
            preferred_years=internship_data.preferred_years,
            required_education=internship_data.required_education,
            location=parsed_data.get('location'),
            duration=parsed_data.get('duration'),
            stipend=parsed_data.get('stipend'),
            rubric_weights=internship_data.rubric_weights,
            skill_weights=internship_data.skill_weights,
            top_responsibilities=internship_data.top_responsibilities,
            key_deliverable=internship_data.key_deliverable,
            requires_portfolio=internship_data.requires_portfolio,
            role_level=internship_data.role_level,
            extracted_skills_raw=internship_data.extracted_skills_raw,
            skills_extraction_confidence=internship_data.skills_extraction_confidence,
            is_active=1
        )
        
        # Calculate content hash for change detection
        content_for_hash = f"{new_internship.title}|{new_internship.description}|{new_internship.required_skills}"
        new_internship.content_hash = hashlib.sha256(content_for_hash.encode()).hexdigest()
        
        db.add(new_internship)
        db.commit()
        db.refresh(new_internship)
        
        # Store embedding in vector DB
        embedding_id = rag_engine.store_internship_embedding(
            internship_id=str(new_internship.id),
            title=new_internship.title,
            description=new_internship.description,
            required_skills=new_internship.required_skills or [],
            metadata={
                "company_id": current_user.id,
                "location": new_internship.location,
                "duration": new_internship.duration
            }
        )
        
        return new_internship
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error posting internship: {str(e)}"
        )


@router.get("/list", response_model=List[InternshipResponse])
def list_internships(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    List all active internships (public endpoint, no authentication required)
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    internships = db.query(Internship).filter(
        Internship.is_active == 1
    ).offset(skip).limit(limit).all()
    
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
            "location": internship.location,
            "duration": internship.duration,
            "stipend": internship.stipend,
            "is_active": internship.is_active
        }
        result.append(internship_dict)
    
    return result


@router.get("/my-posts", response_model=List[InternshipResponse])
def get_my_internships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all internships posted by current company
    """
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view their posts"
        )
    
    internships = db.query(Internship).filter(
        Internship.company_id == current_user.id
    ).order_by(Internship.created_at.desc()).all()
    
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
            "location": internship.location,
            "duration": internship.duration,
            "stipend": internship.stipend,
            "is_active": internship.is_active
        }
        result.append(internship_dict)
    
    return result


@router.get("/match", response_model=List[InternshipWithMatchScore])
def match_internships(
    top_k: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can get internship recommendations"
        )
    
    # Validate top_k parameter
    if top_k < 1 or top_k > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="top_k must be between 1 and 50"
        )
    
    # Get student's active resume
    from app.models import Resume
    resume = db.query(Resume).filter(
        Resume.student_id == current_user.id,
        Resume.is_active == 1
    ).first()
    
    if not resume:
        logger.warning(f"Student {current_user.id} has no active resume")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active resume found. Please upload a resume first to get personalized recommendations."
        )
    
    logger.info(f"Found active resume {resume.id} for student {current_user.id}")
    logger.info(f"Resume details - ID: {resume.id}, file_name: {resume.file_name}, is_active: {resume.is_active}, embedding_id: {resume.embedding_id}")
    
    try:
        # Get matching internships from RAG engine
        resume_id_str = str(resume.id)
        logger.info(f"Calling RAG engine to find matches for resume_id: {resume_id_str} (type: {type(resume_id_str)})")
        matches = rag_engine.find_matching_internships(
            resume_id=resume_id_str,
            top_k=top_k
        )
        
        logger.info(f"RAG engine returned {len(matches) if matches else 0} matches")
        
        if not matches:
            logger.info("No matches found, returning empty list")
            return []
        
        # Fetch full internship details
        internship_ids = [int(m['internship_id']) for m in matches]
        logger.info(f"Fetching details for internship IDs: {internship_ids}")
        
        internships = db.query(Internship).filter(
            Internship.id.in_(internship_ids),
            Internship.is_active == 1
        ).all()
        
        logger.info(f"Found {len(internships)} active internships in database")
        
        # Create mapping of internship_id to internship
        internship_map = {str(i.id): i for i in internships}
        
        # Get all applications for this student to check which internships they've applied to
        applications = db.query(Application).filter(
            Application.student_id == current_user.id,
            Application.internship_id.in_(internship_ids)
        ).all()
        
        # Create mapping of internship_id to application (with resume info)
        application_map = {}
        for app in applications:
            # Get the resume used for this application
            app_resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
            application_map[app.internship_id] = {
                'has_applied': True,
                'resume_name': app_resume.file_name if app_resume else None
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
                    "location": internship.location or "",
                    "duration": internship.duration or "",
                    "stipend": internship.stipend or "",
                    "is_active": internship.is_active,
                    "match_score": match['match_score'],
                    "has_applied": app_info['has_applied'],
                    "application_resume_name": app_info['resume_name']
                }
                recommendations.append(InternshipWithMatchScore(**internship_dict))
            else:
                logger.warning(f"Internship {match['internship_id']} not found in database")
        
        logger.info(f"Returning {len(recommendations)} recommendations")
        return recommendations
        
    except Exception as e:
        import traceback
        print(f"Error in match_internships: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recommendations: {str(e)}"
        )


@router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get internship details by ID
    """
    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.is_active == 1
    ).first()
    
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found"
        )
    
    # Return internship with company name
    internship_dict = {
        "id": internship.id,
        "company_id": internship.company_id,
        "company_name": internship.company.full_name if internship.company else "Unknown Company",
        "title": internship.title,
        "description": internship.description,
        "required_skills": internship.required_skills,
        "location": internship.location,
        "duration": internship.duration,
        "stipend": internship.stipend,
        "is_active": internship.is_active
    }
    
    return internship_dict


@router.put("/{internship_id}", response_model=InternshipResponse)
def update_internship(
    internship_id: int,
    internship_data: InternshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an internship posting
    """
    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.company_id == current_user.id
    ).first()
    
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found"
        )
    
    try:
        # Parse updated data
        parsed_data = InternshipParser.parse_internship(internship_data.dict())
        
        # Update fields
        internship.title = parsed_data['title']
        internship.description = parsed_data['description']
        internship.required_skills = parsed_data.get('required_skills')
        internship.location = parsed_data.get('location')
        internship.duration = parsed_data.get('duration')
        internship.stipend = parsed_data.get('stipend')
        
        db.commit()
        db.refresh(internship)
        
        # Update embedding in vector DB
        rag_engine.store_internship_embedding(
            internship_id=str(internship.id),
            title=internship.title,
            description=internship.description,
            required_skills=internship.required_skills or [],
            metadata={
                "company_id": current_user.id,
                "location": internship.location,
                "duration": internship.duration
            }
        )
        
        return internship
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating internship: {str(e)}"
        )


@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_internship(
    internship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete/deactivate an internship posting
    """
    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.company_id == current_user.id
    ).first()
    
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found"
        )
    
    # Soft delete - just deactivate
    internship.is_active = 0
    db.commit()
    
    # Delete from vector DB
    rag_engine.delete_internship_embedding(str(internship.id))
    
    return None


# Application Management Endpoints
class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None
    use_tailored_resume: bool = False  # NEW: Flag to indicate tailored resume usage


class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    internship_id: int
    resume_id: int
    status: str
    match_score: Optional[int] = None
    application_similarity_score: Optional[int] = None
    used_tailored_resume: int
    created_at: str
    
    class Config:
        from_attributes = True


@router.post("/{internship_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_internship(
    internship_id: int,
    cover_letter: Optional[str] = Form(None),
    use_tailored_resume: bool = Form(False),
    tailored_resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can apply to internships"
        )
    
    # Check if internship exists and is active
    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.is_active == 1
    ).first()
    
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found or no longer active"
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
    
    # Check if already applied
    existing_application = db.query(Application).filter(
        Application.student_id == current_user.id,
        Application.internship_id == internship_id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this internship"
        )
    
    try:
        logger.info(f"Processing application for student {current_user.id} to internship {internship_id}")
        
        # Handle tailored resume if provided
        used_tailored = False
        resume_to_use = resume  # Default to active resume
        
        if use_tailored_resume and tailored_resume:
            logger.info(f"Processing tailored resume for application")
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
                    deactivate_others=False  # Don't deactivate base resume
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
            'total_experience_years': resume_to_use.parsed_data.get('total_experience_years', 0) if resume_to_use.parsed_data else 0,
            'education': resume_to_use.parsed_data.get('education', []) if resume_to_use.parsed_data else [],
            'projects': resume_to_use.parsed_data.get('projects', []) if resume_to_use.parsed_data else [],
            'certifications': resume_to_use.parsed_data.get('certifications', []) if resume_to_use.parsed_data else []
        }
        
        # Prepare internship data
        internship_data = {
            'required_skills': internship.required_skills or [],
            'preferred_skills': internship.preferred_skills or [],
            'min_experience': internship.min_experience or 0,
            'max_experience': internship.max_experience or 10,
            'required_education': internship.required_education or ''
        }
        
        # Get embeddings from the resume being used (base or tailored)
        candidate_embedding = resume_to_use.embedding or []
        try:
            internship_embedding = rag_engine.get_internship_embedding(str(internship.id))
        except:
            internship_embedding = []
        
        # Calculate match score
        match_result = matching_engine.calculate_match_score(
            candidate_data=candidate_data,
            internship_data=internship_data,
            candidate_embedding=candidate_embedding,
            internship_embedding=internship_embedding
        )
        
        application_similarity = int(match_result['overall_score'])
        logger.info(f"Calculated application similarity: {application_similarity}% (using {'tailored' if used_tailored else 'active'} resume)")
        
        # Try to get pre-computed base similarity as fallback/comparison
        base_match = db.query(StudentInternshipMatch).filter(
            StudentInternshipMatch.student_id == current_user.id,
            StudentInternshipMatch.internship_id == internship_id
        ).first()
        
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
            used_tailored_resume=1 if used_tailored else 0  # Track if tailored resume was used
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
            created_at=str(new_application.created_at)
        )
        
    except Exception as e:
        import traceback
        logger.error(f"❌ Error creating application: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating application: {str(e)}"
        )


@router.get("/applications/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all applications for the current student
    """
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their applications"
        )
    
    applications = db.query(Application).filter(
        Application.student_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
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
            created_at=str(app.created_at)
        )
        for app in applications
    ]


# ==========================================
# PHASE 4: PRECOMPUTATION ENDPOINTS
# ==========================================

@router.post("/{internship_id}/precompute")
def precompute_candidate_explanations(
    internship_id: int,
    top_n: int = 50,
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Task 4.4: Precompute explanations for top N candidates (Admin/Company endpoint)**
    
    Generates explanations in batch for all matched candidates to improve response times
    when HR reviews the candidate list. This is useful for:
    - Background processing after new internship posting
    - Batch updates when resume parsing completes
    - Reducing initial load time in candidate review UI
    
    **Access Control:**
    - Companies can precompute for their own internships
    - Admins can precompute for any internship
    
    **Query Parameters:**
    - `top_n`: Number of top candidates to precompute (default: 50, max: 200)
    - `force_refresh`: Force regeneration even if cache exists (default: false)
    
    **Cache Invalidation:**
    Cached explanations are automatically invalidated when:
    - More than 24 hours old
    - Internship requirements are updated
    - Candidate resume is updated
    
    **Example Response:**
    ```json
    {
      "internship_id": 456,
      "requested_count": 50,
      "processed": 48,
      "cached": 25,
      "new": 23,
      "errors": 2,
      "error_details": ["Failed to generate explanation for candidate 789"],
      "duration_seconds": 45.2,
      "message": "Precomputation complete. 48/50 candidates processed."
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
            detail="Students cannot trigger precomputation"
        )
    # Admins have full access
    
    # Limit top_n to reasonable bounds
    if top_n > 200:
        top_n = 200
        logger.warning(f"⚠️  Limiting top_n to 200 (requested: {top_n})")
    
    logger.info(f"🔄 Starting precomputation for internship {internship_id} (top {top_n} candidates)")
    
    # Trigger precomputation
    from app.services.precompute_service import get_precompute_service
    
    precompute_service = get_precompute_service()
    
    results = precompute_service.precompute_explanations_for_internship(
        internship_id=internship_id,
        db_session=db,
        top_n=top_n,
        force_refresh=force_refresh
    )
    
    # Build response message
    success_rate = (results['processed'] / results['requested_count'] * 100) if results['requested_count'] > 0 else 0
    
    results['message'] = (
        f"Precomputation complete. {results['processed']}/{results['requested_count']} candidates processed "
        f"({results['new']} new, {results['cached']} cached, {results['errors']} errors) "
        f"in {results['duration_seconds']}s. Success rate: {success_rate:.1f}%"
    )
    
    logger.info(f"✅ {results['message']}")
    
    return results


@router.get("/{internship_id}/precompute-status")
def get_precompute_status(
    internship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    **Get status of precomputed explanations for an internship**
    
    Returns information about cache coverage and freshness to help decide
    when to trigger precomputation.
    
    **Access Control:**
    - Companies can check status for their own internships
    - Admins can check status for any internship
    
    **Example Response:**
    ```json
    {
      "internship_id": 456,
      "total_matches": 120,
      "precomputed_count": 50,
      "fresh_count": 45,
      "stale_count": 5,
      "coverage_percent": 41.67,
      "needs_refresh": true
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
            detail="Students cannot check precompute status"
        )
    # Admins have full access
    
    logger.info(f"📊 Checking precompute status for internship {internship_id}")
    
    from app.services.precompute_service import get_precompute_service
    
    precompute_service = get_precompute_service()
    
    status_report = precompute_service.get_precompute_status(
        internship_id=internship_id,
        db_session=db
    )
    
    return status_report
