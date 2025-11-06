"""
Precomputation Service
Generates explanations in batch for all matched candidates
Improves response time by pre-calculating expensive operations
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class PrecomputeService:
    """Service for batch precomputing candidate explanations"""
    
    def __init__(self):
        """Initialize precompute service"""
        logger.info("✅ PrecomputeService initialized")
    
    def precompute_explanations_for_internship(
        self,
        internship_id: int,
        db_session,
        top_n: int = 50,
        force_refresh: bool = False
    ) -> Dict:
        """
        Precompute explanations for top N candidates for an internship
        
        This is useful for:
        - Reducing load time when HR reviews candidates
        - Background processing after new internship posting
        - Batch updates when resume parsing completes
        
        Args:
            internship_id: Internship ID
            db_session: Database session
            top_n: Number of top candidates to precompute (default: 50)
            force_refresh: Force regeneration even if cache exists (default: False)
            
        Returns:
            Status report with counts and timing
        """
        logger.info(f"🔄 Starting precomputation for internship {internship_id} (top {top_n} candidates)")
        
        start_time = datetime.now()
        results = {
            'internship_id': internship_id,
            'requested_count': top_n,
            'processed': 0,
            'cached': 0,
            'new': 0,
            'errors': 0,
            'error_details': [],
            'duration_seconds': 0
        }
        
        try:
            from app.models.internship import Internship
            from app.models.student_internship_match import StudentInternshipMatch
            from app.models.explainability import CandidateExplanation
            from app.services.match_explanation_service import get_match_explanation_service
            
            # Verify internship exists
            internship = db_session.query(Internship).filter(
                Internship.id == internship_id
            ).first()
            
            if not internship:
                logger.error(f"❌ Internship {internship_id} not found")
                results['error_details'].append("Internship not found")
                return results
            
            # Fetch top N candidates from pre-computed matches
            top_matches = db_session.query(StudentInternshipMatch).filter(
                StudentInternshipMatch.internship_id == internship_id
            ).order_by(
                StudentInternshipMatch.base_similarity_score.desc()
            ).limit(top_n).all()
            
            logger.info(f"📋 Found {len(top_matches)} candidates to process")
            
            match_explanation_service = get_match_explanation_service()
            
            # Process each candidate
            for match in top_matches:
                candidate_id = match.student_id
                
                try:
                    # Check if explanation already exists and is recent
                    if not force_refresh:
                        existing = db_session.query(CandidateExplanation).filter(
                            CandidateExplanation.candidate_id == candidate_id,
                            CandidateExplanation.internship_id == internship_id
                        ).order_by(CandidateExplanation.created_at.desc()).first()
                        
                        if existing:
                            from datetime import timezone
                            age = datetime.now(timezone.utc) - existing.created_at
                            if age < timedelta(hours=24):
                                logger.debug(f"⏭️  Using cached explanation for candidate {candidate_id}")
                                results['cached'] += 1
                                results['processed'] += 1
                                continue
                    
                    # Generate new explanation
                    logger.info(f"🔍 Generating explanation for candidate {candidate_id}...")
                    
                    explanation = match_explanation_service.generate_explanation(
                        candidate_id=candidate_id,
                        internship_id=internship_id,
                        db_session=db_session
                    )
                    
                    if explanation:
                        results['new'] += 1
                        results['processed'] += 1
                        logger.debug(f"✅ Generated explanation for candidate {candidate_id}")
                    else:
                        results['errors'] += 1
                        results['error_details'].append(f"Failed to generate explanation for candidate {candidate_id}")
                        logger.warning(f"⚠️  Failed to generate explanation for candidate {candidate_id}")
                
                except Exception as e:
                    results['errors'] += 1
                    error_msg = f"Error processing candidate {candidate_id}: {str(e)}"
                    results['error_details'].append(error_msg)
                    logger.error(f"❌ {error_msg}")
                    # Continue with next candidate
                    continue
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            results['duration_seconds'] = round(duration, 2)
            
            logger.info(
                f"✅ Precomputation complete: {results['processed']}/{top_n} processed "
                f"({results['new']} new, {results['cached']} cached, {results['errors']} errors) "
                f"in {duration:.2f}s"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error during precomputation: {e}", exc_info=True)
            results['error_details'].append(f"Precomputation failed: {str(e)}")
            return results
    
    def invalidate_cache_for_internship(
        self,
        internship_id: int,
        db_session
    ) -> int:
        """
        Invalidate (delete) cached explanations for an internship
        
        Call this when:
        - Internship requirements are updated
        - Job description is modified
        - Skill weights are changed
        
        Args:
            internship_id: Internship ID
            db_session: Database session
            
        Returns:
            Number of cached explanations deleted
        """
        logger.info(f"🗑️  Invalidating cached explanations for internship {internship_id}")
        
        try:
            from app.models.explainability import CandidateExplanation
            
            deleted_count = db_session.query(CandidateExplanation).filter(
                CandidateExplanation.internship_id == internship_id
            ).delete()
            
            db_session.commit()
            
            logger.info(f"✅ Deleted {deleted_count} cached explanations")
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ Error invalidating cache: {e}")
            db_session.rollback()
            return 0
    
    def invalidate_cache_for_candidate(
        self,
        candidate_id: int,
        db_session
    ) -> int:
        """
        Invalidate (delete) cached explanations for a candidate
        
        Call this when:
        - Resume is updated
        - Skills are re-parsed
        - Profile information changes
        
        Args:
            candidate_id: Candidate user ID
            db_session: Database session
            
        Returns:
            Number of cached explanations deleted
        """
        logger.info(f"🗑️  Invalidating cached explanations for candidate {candidate_id}")
        
        try:
            from app.models.explainability import CandidateExplanation
            
            deleted_count = db_session.query(CandidateExplanation).filter(
                CandidateExplanation.candidate_id == candidate_id
            ).delete()
            
            db_session.commit()
            
            logger.info(f"✅ Deleted {deleted_count} cached explanations")
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ Error invalidating cache: {e}")
            db_session.rollback()
            return 0
    
    def get_precompute_status(
        self,
        internship_id: int,
        db_session
    ) -> Dict:
        """
        Get status of precomputed explanations for an internship
        
        Args:
            internship_id: Internship ID
            db_session: Database session
            
        Returns:
            Status report with counts and freshness
        """
        try:
            from app.models.explainability import CandidateExplanation
            from app.models.student_internship_match import StudentInternshipMatch
            
            # Count total matched candidates
            total_matches = db_session.query(StudentInternshipMatch).filter(
                StudentInternshipMatch.internship_id == internship_id
            ).count()
            
            # Count precomputed explanations
            precomputed = db_session.query(CandidateExplanation).filter(
                CandidateExplanation.internship_id == internship_id
            ).all()
            
            precomputed_count = len(precomputed)
            
            # Calculate freshness
            fresh_count = 0  # < 24 hours old
            stale_count = 0  # >= 24 hours old
            
            if precomputed:
                from datetime import timezone
                now = datetime.now(timezone.utc)
                for exp in precomputed:
                    age = now - exp.created_at
                    if age < timedelta(hours=24):
                        fresh_count += 1
                    else:
                        stale_count += 1
            
            coverage_percent = (precomputed_count / total_matches * 100) if total_matches > 0 else 0
            
            return {
                'internship_id': internship_id,
                'total_matches': total_matches,
                'precomputed_count': precomputed_count,
                'fresh_count': fresh_count,
                'stale_count': stale_count,
                'coverage_percent': round(coverage_percent, 2),
                'needs_refresh': stale_count > 0 or precomputed_count < total_matches
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting precompute status: {e}")
            return {
                'internship_id': internship_id,
                'error': str(e)
            }


# Singleton instance
_precompute_service_instance = None


def get_precompute_service() -> PrecomputeService:
    """Get or create singleton PrecomputeService instance"""
    global _precompute_service_instance
    if _precompute_service_instance is None:
        _precompute_service_instance = PrecomputeService()
    return _precompute_service_instance
