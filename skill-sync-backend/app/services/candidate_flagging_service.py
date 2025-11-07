"""
Candidate Flagging Service - Detects duplicate candidates based on contact info
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Dict, Optional
from app.models.user import User, UserRole
import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class CandidateFlaggingService:
    """Service to detect and flag duplicate candidates"""
    
    @staticmethod
    def normalize_url(url: Optional[str]) -> Optional[str]:
        """
        Normalize URLs for comparison (remove protocols, www, trailing slashes)
        
        Args:
            url: The URL to normalize
            
        Returns:
            Normalized URL string or None
        """
        if not url:
            return None
        
        # Remove whitespace
        url = url.strip()
        
        # Parse URL
        try:
            parsed = urlparse(url)
            
            # Extract domain and path
            domain = parsed.netloc or parsed.path.split('/')[0]
            path = parsed.path if parsed.netloc else '/'.join(parsed.path.split('/')[1:])
            
            # Remove 'www.' prefix
            domain = re.sub(r'^www\.', '', domain, flags=re.IGNORECASE)
            
            # Combine domain and path, remove trailing slash
            normalized = f"{domain}{path}".rstrip('/')
            
            # Convert to lowercase for case-insensitive comparison
            return normalized.lower()
        except Exception as e:
            logger.warning(f"Failed to normalize URL '{url}': {e}")
            return url.lower().strip()
    
    @staticmethod
    def normalize_phone(phone: Optional[str]) -> Optional[str]:
        """
        Normalize phone numbers for comparison (remove all non-digits)
        
        Args:
            phone: The phone number to normalize
            
        Returns:
            Normalized phone string (digits only) or None
        """
        if not phone:
            return None
        
        # Extract only digits
        digits = re.sub(r'\D', '', phone)
        
        return digits if digits else None
    
    @staticmethod
    def detect_flagged_candidates(db: Session) -> Dict[int, Dict]:
        """
        Detect all flagged candidates globally across the platform
        
        Returns a dictionary mapping student_id to flag information:
        {
            student_id: {
                'reasons': ['same_mobile', 'same_linkedin', 'same_github'],
                'flagged_with': {
                    'same_mobile': [student_ids],
                    'same_linkedin': [student_ids],
                    'same_github': [student_ids]
                }
            }
        }
        """
        logger.info("🔍 Starting candidate flagging detection...")
        
        # Get all students with contact info
        students = db.query(User).filter(User.role == UserRole.student).all()
        
        # Build normalized lookup maps
        phone_map = {}  # normalized_phone -> [student_ids]
        linkedin_map = {}  # normalized_linkedin -> [student_ids]
        github_map = {}  # normalized_github -> [student_ids]
        
        for student in students:
            # Normalize and map phone
            if student.phone:
                normalized_phone = CandidateFlaggingService.normalize_phone(student.phone)
                if normalized_phone:
                    if normalized_phone not in phone_map:
                        phone_map[normalized_phone] = []
                    phone_map[normalized_phone].append(student.id)
            
            # Normalize and map LinkedIn
            if student.linkedin_url:
                normalized_linkedin = CandidateFlaggingService.normalize_url(student.linkedin_url)
                if normalized_linkedin:
                    if normalized_linkedin not in linkedin_map:
                        linkedin_map[normalized_linkedin] = []
                    linkedin_map[normalized_linkedin].append(student.id)
            
            # Normalize and map GitHub
            if student.github_url:
                normalized_github = CandidateFlaggingService.normalize_url(student.github_url)
                if normalized_github:
                    if normalized_github not in github_map:
                        github_map[normalized_github] = []
                    github_map[normalized_github].append(student.id)
        
        # Find duplicates (groups with more than 1 student)
        flagged_candidates = {}
        
        # Check phone duplicates
        for normalized_phone, student_ids in phone_map.items():
            if len(student_ids) > 1:
                logger.warning(f"⚠️ Found {len(student_ids)} students with same phone: {normalized_phone}")
                for student_id in student_ids:
                    if student_id not in flagged_candidates:
                        flagged_candidates[student_id] = {
                            'reasons': [],
                            'flagged_with': {}
                        }
                    flagged_candidates[student_id]['reasons'].append('same_mobile')
                    # Store OTHER students with same phone
                    flagged_candidates[student_id]['flagged_with']['same_mobile'] = [
                        sid for sid in student_ids if sid != student_id
                    ]
        
        # Check LinkedIn duplicates
        for normalized_linkedin, student_ids in linkedin_map.items():
            if len(student_ids) > 1:
                logger.warning(f"⚠️ Found {len(student_ids)} students with same LinkedIn: {normalized_linkedin}")
                for student_id in student_ids:
                    if student_id not in flagged_candidates:
                        flagged_candidates[student_id] = {
                            'reasons': [],
                            'flagged_with': {}
                        }
                    flagged_candidates[student_id]['reasons'].append('same_linkedin')
                    flagged_candidates[student_id]['flagged_with']['same_linkedin'] = [
                        sid for sid in student_ids if sid != student_id
                    ]
        
        # Check GitHub duplicates
        for normalized_github, student_ids in github_map.items():
            if len(student_ids) > 1:
                logger.warning(f"⚠️ Found {len(student_ids)} students with same GitHub: {normalized_github}")
                for student_id in student_ids:
                    if student_id not in flagged_candidates:
                        flagged_candidates[student_id] = {
                            'reasons': [],
                            'flagged_with': {}
                        }
                    flagged_candidates[student_id]['reasons'].append('same_github')
                    flagged_candidates[student_id]['flagged_with']['same_github'] = [
                        sid for sid in student_ids if sid != student_id
                    ]
        
        logger.info(f"✅ Flagging detection complete. Found {len(flagged_candidates)} flagged candidates")
        
        return flagged_candidates
    
    @staticmethod
    def get_flag_info_for_candidates(
        candidate_ids: List[int],
        db: Session
    ) -> Dict[int, Dict]:
        """
        Get flagging information for a specific list of candidates
        
        Args:
            candidate_ids: List of candidate/student IDs to check
            db: Database session
            
        Returns:
            Dictionary mapping candidate_id to flag info
        """
        # Get all flagged candidates globally
        all_flagged = CandidateFlaggingService.detect_flagged_candidates(db)
        
        # Filter to only requested candidates
        result = {}
        for candidate_id in candidate_ids:
            if candidate_id in all_flagged:
                result[candidate_id] = all_flagged[candidate_id]
        
        return result
    
    @staticmethod
    def format_flag_reason(reasons: List[str]) -> str:
        """
        Format flag reasons into human-readable text
        
        Args:
            reasons: List of reason codes ('same_mobile', 'same_linkedin', 'same_github')
            
        Returns:
            Formatted reason string
        """
        reason_map = {
            'same_mobile': 'Mobile number',
            'same_linkedin': 'LinkedIn',
            'same_github': 'GitHub'
        }
        
        formatted_reasons = [reason_map.get(r, r) for r in reasons]
        
        if len(formatted_reasons) == 1:
            return f"Same {formatted_reasons[0]}"
        elif len(formatted_reasons) == 2:
            return f"Same {formatted_reasons[0]} & {formatted_reasons[1]}"
        else:
            return f"Same {', '.join(formatted_reasons[:-1])} & {formatted_reasons[-1]}"
