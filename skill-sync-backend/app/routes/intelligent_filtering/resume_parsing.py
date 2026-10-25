"""POST /api/filter/parse-resume."""

from fastapi import Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.routes.intelligent_filtering.common import router
from app.services.resume_service import ResumeService
from app.utils.security import get_current_user


@router.post("/parse-resume")
async def parse_and_extract_resume(
    file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Parse resume and extract structured information using Gemini AI

    This endpoint (used by Resume Intelligence UI):
    1. Uploads resume to S3 for cloud storage (HR can view it later)
    2. Extracts text from uploaded resume (PDF/DOCX)
    3. Uses Gemini to extract structured data (skills, experience, education)
    4. Calculates total experience (handling overlaps)
    5. Generates embeddings and stores in ChromaDB
    6. Stores in database with vector embeddings and S3 key

    Returns structured candidate profile with parsed data
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"[RESUME UPLOAD] User {current_user.id} uploading: {file.filename}")

        # Use ResumeService for consistent S3 upload + processing
        # This ensures the resume is uploaded to S3 so HR can view it
        resume = await ResumeService.upload_and_process_resume(
            file=file, student_id=current_user.id, db=db, is_tailored=False, deactivate_others=True
        )

        # Update user profile with extracted data
        structured_data = resume.parsed_data or {}
        current_user.skills = structured_data.get('all_skills', [])
        current_user.total_experience_years = structured_data.get('total_experience_years', 0)
        db.commit()

        logger.info(f"[RESUME UPLOAD] ✅ Resume {resume.id} uploaded and indexed successfully!")
        logger.info(f"[RESUME UPLOAD] 📁 S3 Key: {resume.s3_key}")

        return {
            "success": True,
            "message": "Resume parsed and analyzed successfully",
            "resume_id": resume.resume_id,
            "s3_key": resume.s3_key,  # Include S3 key in response
            "structured_data": structured_data,
            "processing_details": {
                "skills_extracted": len(structured_data.get('all_skills', [])),
                "experience_calculated": f"{structured_data.get('total_experience_years', 0)} years",
                "education_found": len(structured_data.get('education', [])),
                "projects_found": len(structured_data.get('projects', [])),
                "certifications_found": len(structured_data.get('certifications', [])),
            },
        }

    except Exception as e:
        import traceback

        logger.error(f"[RESUME UPLOAD]   Error processing resume: {str(e)}")
        logger.error(f"[RESUME UPLOAD] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")
