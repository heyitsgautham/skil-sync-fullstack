"""Posting an internship: skill extraction, document parsing and the post endpoint."""

import logging
import os

from fastapi import Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Internship, User, UserRole
from app.routes.internship.common import router
from app.routes.internship.schemas import (
    DocumentParseResponse,
    InternshipCreate,
    InternshipResponse,
    SkillExtractionRequest,
    SkillExtractionResponse,
)
from app.services.internship_document_parser import get_internship_document_parser
from app.services.job_description_analyzer import get_job_description_analyzer
from app.services.parser_service import InternshipParser
from app.services.rag_engine import rag_engine
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)


@router.post("/extract-skills", response_model=SkillExtractionResponse)
def extract_skills_from_description(request: SkillExtractionRequest, current_user: User = Depends(get_current_user)):
    """
    Extract required and preferred skills from job description using AI

    - **job_description**: The full job description text

    Returns two separate lists:
    - **required_skills**: Must-have skills
    - **preferred_skills**: Nice-to-have skills

    This endpoint uses Google Gemini AI to intelligently categorize skills
    based on how they are mentioned in the job description.
    """
    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can use skill extraction")

    if not request.job_description or len(request.job_description.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Job description must be at least 50 characters long"
        )

    try:
        # Get job description analyzer instance
        analyzer = get_job_description_analyzer()

        # Extract skills
        result = analyzer.extract_skills(request.job_description)

        return SkillExtractionResponse(
            required_skills=result['required_skills'], preferred_skills=result['preferred_skills']
        )

    except Exception as e:
        logger.exception("Error extracting skills")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error extracting skills: {str(e)}"
        )


@router.post("/parse-document", response_model=DocumentParseResponse)
async def parse_internship_document(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Parse internship details from uploaded document (PDF, DOCX, DOC, TXT)

    Company users can upload job description documents and get auto-extracted details:
    - **title**: Job title/position
    - **description**: Full job description
    - **required_skills**: Must-have skills
    - **preferred_skills**: Nice-to-have skills
    - **location**: Work location
    - **duration**: Internship duration
    - **stipend**: Compensation details
    - **required_education**: Education requirements
    - And more...

    This endpoint uses Google Gemini AI to intelligently extract all information
    from the document. The extracted data can be used to pre-fill the internship
    creation form, allowing company users to review and edit before posting.

    Supported formats: PDF, DOCX, DOC, TXT
    """
    import logging
    import shutil
    import tempfile

    logger = logging.getLogger(__name__)

    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can parse internship documents"
        )

    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Supported formats: {', '.join(allowed_extensions)}",
        )

    # Create temporary file for processing
    temp_file = None
    try:
        logger.info(f"📄 Processing internship document: {file.filename}")

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        logger.info(f"💾 Saved to temporary file: {temp_file_path}")

        # Parse document using AI service
        parser = get_internship_document_parser()
        internship_details = parser.parse_from_file(temp_file_path)

        # Remove original document text from response (too large)
        internship_details.pop('original_document_text', None)
        internship_details.pop('parsing_status', None)

        logger.info(f"✅ Successfully parsed internship: {internship_details.get('title')}")

        return DocumentParseResponse(**internship_details)

    except ValueError as ve:
        # User-friendly validation errors
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        import traceback

        logger.error(f"  Error parsing document: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error parsing document: {str(e)}"
        )
    finally:
        # Cleanup temporary file
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info("🗑️ Cleaned up temporary file")
            except Exception as cleanup_error:
                logger.warning(f"⚠️ Could not delete temp file: {cleanup_error}")


@router.post("/post", response_model=InternshipResponse, status_code=status.HTTP_201_CREATED)
def post_internship(
    internship_data: InternshipCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Post a new internship (Company only)

    - **title**: Internship title
    - **description**: Detailed description
    - **required_skills**: List of required skills (auto-extracted if not provided)
    - **preferred_skills**: List of preferred skills (optional)
    - **location**: Location (optional)
    - **duration**: Duration (optional)
    - **stipend**: Stipend information (optional)
    - **min_experience**: Minimum years of experience (optional)
    - **max_experience**: Maximum years of experience (optional)
    - **required_education**: Required education level (optional)
    """
    # Verify user is a company
    if current_user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can post internships")

    try:
        # Parse internship data to extract skills if not provided
        parsed_data = InternshipParser.parse_internship(internship_data.dict())

        # Create internship record
        new_internship = Internship(
            company_id=current_user.id,
            title=parsed_data['title'],
            description=parsed_data['description'],
            required_skills=parsed_data.get('required_skills'),
            preferred_skills=parsed_data.get('preferred_skills'),
            location=parsed_data.get('location'),
            duration=parsed_data.get('duration'),
            stipend=parsed_data.get('stipend'),
            min_experience=parsed_data.get('min_experience'),
            max_experience=parsed_data.get('max_experience'),
            required_education=parsed_data.get('required_education'),
            is_active=1,
        )

        db.add(new_internship)
        db.commit()
        db.refresh(new_internship)

        # Store embedding in vector DB
        rag_engine.store_internship_embedding(
            internship_id=str(new_internship.id),
            title=new_internship.title,
            description=new_internship.description,
            required_skills=new_internship.required_skills or [],
            metadata={
                "company_id": current_user.id,
                "location": new_internship.location,
                "duration": new_internship.duration,
            },
        )

        return new_internship

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error posting internship: {str(e)}"
        )
