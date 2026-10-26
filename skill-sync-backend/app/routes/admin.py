"""
Admin API Routes
Endpoints for administrative operations
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import User, UserRole
from app.services.embedding_recompute_service import EmbeddingRecomputeService
from app.utils.errors import internal_error
from app.utils.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# Where uploaded and seeded resume files live, relative to the backend root.
RESUME_DIR = "app/public/resumes"


class RecomputeResponse(BaseModel):
    """Response model for recompute embeddings endpoint"""

    message: str
    resumes: dict
    internships: dict
    matches: dict | None = None

    class Config:
        from_attributes = True


@router.post("/recompute-embeddings", response_model=RecomputeResponse)
def recompute_all_embeddings_and_matches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Recompute all embeddings and recalculate matches (Admin only)

    This endpoint:
    1. Recomputes embeddings for all resumes (base + tailored)
    2. Recomputes embeddings for all active internships
    3. Recalculates all student-internship matches

    Uses intelligent caching based on content hashing:
    - Only recomputes if content has changed
    - Shows progress of cached vs newly computed

    Returns detailed progress information.
    """
    import logging

    logger = logging.getLogger(__name__)

    # Verify user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can recompute embeddings")

    try:
        logger.info(f"🔄 Admin {current_user.email} initiated embedding recomputation")

        # Step 1: Recompute embeddings
        logger.info("📊 Step 1/2: Recomputing embeddings...")
        embedding_results = EmbeddingRecomputeService.recompute_all_embeddings(db)

        logger.info(
            f"✅ Resumes: {embedding_results['resumes']['cached']} cached, "
            f"{embedding_results['resumes']['recomputed']} recomputed, "
            f"{embedding_results['resumes']['failed']} failed"
        )

        logger.info(
            f"✅ Internships: {embedding_results['internships']['cached']} cached, "
            f"{embedding_results['internships']['recomputed']} recomputed, "
            f"{embedding_results['internships']['failed']} failed"
        )

        # Step 2: Recalculate matches
        logger.info("🔗 Step 2/2: Recalculating student-internship matches...")
        match_results = EmbeddingRecomputeService.recalculate_all_matches(db)

        logger.info(f"✅ Matches: {match_results['successful']} calculated, {match_results['failed']} failed")

        logger.info("🎉 Embedding recomputation completed successfully!")

        # Prepare summary
        resume_summary = (
            f"{embedding_results['resumes']['cached']} cached, {embedding_results['resumes']['recomputed']} recomputed"
        )

        internship_summary = (
            f"{embedding_results['internships']['cached']} cached, "
            f"{embedding_results['internships']['recomputed']} recomputed"
        )

        return RecomputeResponse(
            message="Successfully recomputed embeddings and matches",
            resumes={
                'total': embedding_results['resumes']['total'],
                'cached': embedding_results['resumes']['cached'],
                'recomputed': embedding_results['resumes']['recomputed'],
                'failed': embedding_results['resumes']['failed'],
                'summary': resume_summary,
            },
            internships={
                'total': embedding_results['internships']['total'],
                'cached': embedding_results['internships']['cached'],
                'recomputed': embedding_results['internships']['recomputed'],
                'failed': embedding_results['internships']['failed'],
                'summary': internship_summary,
            },
            matches={
                'total': match_results['total_matches'],
                'successful': match_results['successful'],
                'failed': match_results['failed'],
            },
        )

    except Exception:
        raise internal_error("Error recomputing embeddings")


@router.post("/clear-chromadb")
def clear_chromadb_embeddings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Clear all student resume embeddings from ChromaDB (Admin only)

    This will:
    1. Delete all resume embeddings from ChromaDB
    2. Clear student-internship match data from database
    3. Clear embedding_id from resumes table

    ⚠️ WARNING: This is a destructive operation!
    """
    import logging

    logger = logging.getLogger(__name__)

    # Verify user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can clear ChromaDB")

    try:
        from app.models import Resume, StudentInternshipMatch
        from app.services.rag_engine import rag_engine

        logger.info(f"🗑️  Admin {current_user.email} initiated ChromaDB cleanup")

        # Step 1: Clear ALL embeddings from ChromaDB at once (NEW BULK METHOD)
        chromadb_cleared_count = rag_engine.clear_all_resume_embeddings()
        logger.info(f"📊 Cleared {chromadb_cleared_count} embeddings from ChromaDB")

        # Step 2: Get all resumes with embedding_id in PostgreSQL
        resumes = db.query(Resume).filter(Resume.embedding_id.isnot(None)).all()

        logger.info(f"📊 Found {len(resumes)} resumes with embedding_id in PostgreSQL")

        # Step 3: Clear embedding_id from PostgreSQL
        for resume in resumes:
            resume.embedding_id = None

        # Step 4: Clear student-internship matches
        matches_deleted = db.query(StudentInternshipMatch).delete()

        # Commit changes
        db.commit()

        logger.info("✅ ChromaDB cleanup completed!")
        logger.info(f"   - ChromaDB embeddings deleted: {chromadb_cleared_count}")
        logger.info(f"   - PostgreSQL resumes cleared: {len(resumes)}")
        logger.info(f"   - Matches cleared: {matches_deleted}")

        return {
            "success": True,
            "message": "Successfully cleared ChromaDB embeddings",
            "resumes_cleared": chromadb_cleared_count,
            "postgres_cleared": len(resumes),
            "matches_cleared": matches_deleted,
        }

    except Exception:
        db.rollback()
        raise internal_error("Error clearing ChromaDB")


@router.post("/reindex-all-students")
def reindex_all_student_resumes(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Re-parse and re-index every stored student resume file (Admin only)

    This will:
    1. Find all resume files in app/public/resumes/
    2. Match each file to the active resume record with that file name, skipping files no one owns
    3. Extract the text, parse it with Gemini and store a new embedding in ChromaDB
    4. Update that resume and the student's skills in place
    5. Recalculate student-internship matches

    This is a background task that may take several minutes.
    """
    import glob
    import logging
    import os

    logger = logging.getLogger(__name__)

    # Verify user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can reindex resumes")

    try:
        from app.models import Resume
        from app.models import User as UserModel
        from app.services.parser_service import ResumeParser
        from app.services.rag_engine import rag_engine
        from app.services.resume_intelligence_service import ResumeIntelligenceService

        logger.info(f"🔄 Admin {current_user.email} initiated full resume reindexing")

        # Find all resume files in app/public/resumes/
        resume_dir = RESUME_DIR
        if not os.path.exists(resume_dir):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Resume directory not found: {resume_dir}"
            )

        # Get all PDF, DOCX, and TXT files, in name order so runs are repeatable
        resume_files = []
        for ext in ['*.pdf', '*.docx', '*.txt']:
            resume_files.extend(glob.glob(os.path.join(resume_dir, ext)))
        resume_files.sort()

        if not resume_files:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume files found in directory")

        logger.info(f"📊 Found {len(resume_files)} resume files to process")

        # Initialize services
        parser = ResumeParser()
        intelligence_service = ResumeIntelligenceService()

        def read_text(resume_file):
            if resume_file.endswith('.pdf'):
                return parser.extract_text_from_pdf(resume_file)
            if resume_file.endswith('.docx'):
                return parser.extract_text_from_docx(resume_file)
            with open(resume_file, encoding='utf-8') as f:
                return f.read()

        def process_all_resumes():
            successful = 0
            failed = 0

            for resume_file in resume_files:
                file_name = os.path.basename(resume_file)
                try:
                    # The stored resume that points at this file says whose it is. Files no
                    # account owns are skipped before any Gemini call.
                    resume = (
                        db.query(Resume)
                        .filter(Resume.file_name == file_name, Resume.is_active == 1)
                        .order_by(Resume.id.desc())
                        .first()
                    )
                    if resume is None:
                        logger.warning(f"⚠️  No active resume record for file: {file_name}")
                        failed += 1
                        continue
                    student = db.get(UserModel, resume.student_id)

                    logger.info(f"📄 Processing: {file_name}")
                    text = read_text(resume_file)
                    structured_data = intelligence_service.extract_structured_data(text)
                    if structured_data.get('parse_failed'):
                        # Keep the resume's last good parse rather than overwrite it with an empty one
                        logger.warning(f"⚠️  Gemini could not parse {file_name}, keeping its previous data")
                        failed += 1
                        continue
                    skills = structured_data.get('all_skills', [])

                    embedding_id = rag_engine.store_resume_embedding(
                        resume_id=str(resume.id),
                        content=text,
                        skills=skills,
                        metadata={
                            'student_id': resume.student_id,
                            'file_name': file_name,
                            'total_experience': structured_data.get('total_experience_years', 0),
                        },
                    )

                    resume.parsed_content = text
                    resume.parsed_data = structured_data
                    resume.extracted_skills = skills
                    resume.embedding_id = embedding_id
                    if student is not None:
                        student.skills = skills
                        student.total_experience_years = structured_data.get('total_experience_years', 0)

                    db.commit()
                    successful += 1
                    logger.info(f"✅ Successfully processed: {file_name}")

                except Exception:
                    logger.exception(f"  Failed to process {file_name}")
                    db.rollback()
                    failed += 1

            logger.info(f"🎉 Reindexing completed! Success: {successful}, Failed: {failed}")

            # Recalculate matches
            try:
                logger.info("🔗 Recalculating student-internship matches...")
                match_results = EmbeddingRecomputeService.recalculate_all_matches(db)
                logger.info(f"✅ Matches recalculated: {match_results['successful']}")
            except Exception:
                logger.exception("  Failed to recalculate matches")

        # Add to background tasks
        background_tasks.add_task(process_all_resumes)

        return {
            "success": True,
            "message": f"Started reindexing {len(resume_files)} student resumes in background",
            "total_files": len(resume_files),
            "status": "processing",
        }

    except HTTPException:
        raise
    except Exception:
        raise internal_error("Error starting reindexing")


@router.get("/system-status")
def get_system_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get system status including embedding statistics (Admin only)

    Returns counts of resumes, internships, and matches
    """
    from app.models import Internship, Resume, StudentInternshipMatch

    # Verify user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view system status")

    try:
        # Count resumes
        total_resumes = db.query(Resume).count()
        base_resumes = db.query(Resume).filter(Resume.is_tailored == 0).count()
        tailored_resumes = db.query(Resume).filter(Resume.is_tailored == 1).count()
        resumes_with_embeddings = db.query(Resume).filter(Resume.embedding_id.isnot(None)).count()

        # Count internships
        total_internships = db.query(Internship).count()
        active_internships = db.query(Internship).filter(Internship.is_active == 1).count()

        # Count matches
        total_matches = db.query(StudentInternshipMatch).count()

        return {
            'resumes': {
                'total': total_resumes,
                'base': base_resumes,
                'tailored': tailored_resumes,
                'with_embeddings': resumes_with_embeddings,
            },
            'internships': {'total': total_internships, 'active': active_internships},
            'matches': {'total': total_matches},
        }

    except Exception:
        raise internal_error("Error retrieving system status")
