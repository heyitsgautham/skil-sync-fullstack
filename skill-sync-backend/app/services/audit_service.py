"""
Audit Log Service
Creates and manages audit trails for candidate screening and ranking operations
Ensures transparency and fairness in the recruitment process
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime
import hashlib
import json

logger = logging.getLogger(__name__)


class AuditService:
    """Service for creating and managing audit logs"""
    
    def __init__(self):
        """Initialize audit service"""
        logger.info("✅ AuditService initialized")
    
    def create_audit_log(
        self,
        user_id: int,
        action: str,
        internship_id: int,
        candidate_ids: List[int],
        filters: Optional[Dict] = None,
        blind_mode: bool = False,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        db_session = None
    ) -> Optional[str]:
        """
        Create an audit log entry
        
        Args:
            user_id: ID of user performing action
            action: Action type (rank, explain, shortlist, compare)
            internship_id: Internship being evaluated
            candidate_ids: List of candidate IDs involved
            filters: Filters applied during action
            blind_mode: Whether blind screening was active
            ip_address: IP address of request
            user_agent: User agent string
            db_session: Database session
            
        Returns:
            Audit ID if successful, None otherwise
        """
        logger.info(f"📝 Creating audit log for user {user_id}, action: {action}")
        
        try:
            from app.models.explainability import AuditLog
            
            # Generate unique audit ID
            audit_id = self.generate_audit_id()
            
            # Calculate result hash for verification
            result_data = {
                'action': action,
                'internship_id': internship_id,
                'candidate_ids': sorted(candidate_ids),  # Sort for consistent hashing
                'filters': filters or {},
                'blind_mode': blind_mode,
                'timestamp': datetime.now().isoformat()
            }
            result_hash = self.calculate_result_hash(result_data)
            
            # Create audit log record
            audit_log = AuditLog(
                audit_id=audit_id,
                user_id=user_id,
                action=action,
                internship_id=internship_id,
                candidate_ids=candidate_ids,
                filters_applied=filters or {},
                blind_mode=blind_mode,
                result_hash=result_hash,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db_session.add(audit_log)
            db_session.commit()
            
            logger.info(f"✅ Audit log created: {audit_id}")
            return audit_id
            
        except Exception as e:
            logger.error(f"❌ Error creating audit log: {e}", exc_info=True)
            if db_session:
                db_session.rollback()
            return None
    
    def generate_audit_id(self) -> str:
        """
        Generate unique audit ID in format: AUD-YYYY-MM-DD-XXXX
        
        Returns:
            Audit ID string
        """
        from app.models.explainability import AuditLog
        from sqlalchemy import func
        
        # Get current date
        today = datetime.now()
        date_str = today.strftime("%Y-%m-%d")
        
        # Try to get count of audits created today
        try:
            from app.database.connection import get_db
            db = next(get_db())
            
            count = db.query(func.count(AuditLog.id)).filter(
                func.date(AuditLog.timestamp) == today.date()
            ).scalar() or 0
            
            # Generate sequential number (4 digits)
            seq_num = str(count + 1).zfill(4)
            
            audit_id = f"AUD-{date_str}-{seq_num}"
            
            logger.debug(f"Generated audit ID: {audit_id}")
            return audit_id
            
        except Exception as e:
            logger.error(f"❌ Error generating audit ID: {e}")
            # Fallback to timestamp-based ID
            timestamp = int(datetime.now().timestamp() * 1000)
            return f"AUD-{date_str}-{timestamp}"
    
    def calculate_result_hash(self, result_data: Dict) -> str:
        """
        Calculate SHA-256 hash of result data for verification
        
        Args:
            result_data: Dict containing action details
            
        Returns:
            SHA-256 hash string
        """
        # Convert to sorted JSON string for consistent hashing
        json_str = json.dumps(result_data, sort_keys=True)
        
        # Calculate SHA-256 hash
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))
        result_hash = hash_obj.hexdigest()
        
        logger.debug(f"Calculated result hash: {result_hash[:16]}...")
        return result_hash
    
    def get_audit_trail(
        self,
        internship_id: Optional[int] = None,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        db_session = None
    ) -> List[Dict]:
        """
        Retrieve audit trail with optional filters
        
        Args:
            internship_id: Filter by internship
            user_id: Filter by user
            action: Filter by action type
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum number of records to return
            db_session: Database session
            
        Returns:
            List of audit log dicts
        """
        logger.info(f"🔍 Retrieving audit trail (internship: {internship_id}, user: {user_id}, action: {action})")
        
        try:
            from app.models.explainability import AuditLog
            
            # Build query
            query = db_session.query(AuditLog)
            
            if internship_id:
                query = query.filter(AuditLog.internship_id == internship_id)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if action:
                query = query.filter(AuditLog.action == action)
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            # Order by timestamp descending (most recent first)
            query = query.order_by(AuditLog.timestamp.desc())
            
            # Apply limit
            query = query.limit(limit)
            
            # Execute query
            audit_logs = query.all()
            
            # Convert to dicts
            results = []
            for log in audit_logs:
                results.append({
                    'audit_id': log.audit_id,
                    'user_id': log.user_id,
                    'action': log.action,
                    'internship_id': log.internship_id,
                    'candidate_ids': log.candidate_ids,
                    'filters_applied': log.filters_applied,
                    'blind_mode': log.blind_mode,
                    'result_hash': log.result_hash,
                    'timestamp': log.timestamp.isoformat() if log.timestamp else None,
                    'ip_address': log.ip_address,
                    'user_agent': log.user_agent
                })
            
            logger.info(f"✅ Retrieved {len(results)} audit log entries")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error retrieving audit trail: {e}", exc_info=True)
            return []
    
    def verify_audit_integrity(
        self,
        audit_id: str,
        db_session = None
    ) -> bool:
        """
        Verify audit log integrity by checking hash
        
        Args:
            audit_id: Audit ID to verify
            db_session: Database session
            
        Returns:
            True if hash is valid, False otherwise
        """
        logger.info(f"🔐 Verifying audit integrity for {audit_id}")
        
        try:
            from app.models.explainability import AuditLog
            
            # Get audit log
            audit_log = db_session.query(AuditLog).filter(
                AuditLog.audit_id == audit_id
            ).first()
            
            if not audit_log:
                logger.error(f"❌ Audit log {audit_id} not found")
                return False
            
            # Reconstruct result data
            result_data = {
                'action': audit_log.action,
                'internship_id': audit_log.internship_id,
                'candidate_ids': sorted(audit_log.candidate_ids),
                'filters': audit_log.filters_applied or {},
                'blind_mode': audit_log.blind_mode,
                'timestamp': audit_log.timestamp.isoformat() if audit_log.timestamp else None
            }
            
            # Calculate hash
            calculated_hash = self.calculate_result_hash(result_data)
            
            # Compare with stored hash
            is_valid = calculated_hash == audit_log.result_hash
            
            if is_valid:
                logger.info(f"✅ Audit integrity verified for {audit_id}")
            else:
                logger.warning(f"⚠️  Audit integrity check FAILED for {audit_id}")
                logger.warning(f"   Stored hash:    {audit_log.result_hash}")
                logger.warning(f"   Calculated hash: {calculated_hash}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"❌ Error verifying audit integrity: {e}", exc_info=True)
            return False
    
    def get_audit_statistics(
        self,
        internship_id: Optional[int] = None,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db_session = None
    ) -> Dict:
        """
        Get audit log statistics
        
        Args:
            internship_id: Filter by internship
            user_id: Filter by user
            start_date: Filter by start date
            end_date: Filter by end date
            db_session: Database session
            
        Returns:
            Statistics dict
        """
        logger.info("📊 Calculating audit statistics")
        
        try:
            from app.models.explainability import AuditLog
            from sqlalchemy import func
            
            # Build base query
            query = db_session.query(AuditLog)
            
            if internship_id:
                query = query.filter(AuditLog.internship_id == internship_id)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            # Total count
            total_count = query.count()
            
            # Count by action
            action_counts = db_session.query(
                AuditLog.action,
                func.count(AuditLog.id)
            ).filter(AuditLog.id.in_(query.with_entities(AuditLog.id))).group_by(
                AuditLog.action
            ).all()
            
            # Blind mode usage
            blind_mode_count = query.filter(AuditLog.blind_mode == True).count()
            
            # Unique users
            unique_users = query.with_entities(AuditLog.user_id).distinct().count()
            
            # Unique internships
            unique_internships = query.with_entities(AuditLog.internship_id).distinct().count()
            
            statistics = {
                'total_audits': total_count,
                'action_breakdown': {action: count for action, count in action_counts},
                'blind_mode_usage': blind_mode_count,
                'blind_mode_percentage': (blind_mode_count / total_count * 100) if total_count > 0 else 0,
                'unique_users': unique_users,
                'unique_internships': unique_internships,
                'date_range': {
                    'start': start_date.isoformat() if start_date else None,
                    'end': end_date.isoformat() if end_date else None
                }
            }
            
            logger.info(f"✅ Audit statistics: {total_count} total audits")
            return statistics
            
        except Exception as e:
            logger.error(f"❌ Error calculating audit statistics: {e}", exc_info=True)
            return {
                'total_audits': 0,
                'action_breakdown': {},
                'blind_mode_usage': 0,
                'blind_mode_percentage': 0,
                'unique_users': 0,
                'unique_internships': 0
            }


# Singleton instance
_audit_service_instance = None


def get_audit_service() -> AuditService:
    """Get or create singleton AuditService instance"""
    global _audit_service_instance
    if _audit_service_instance is None:
        _audit_service_instance = AuditService()
    return _audit_service_instance
