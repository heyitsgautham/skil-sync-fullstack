"""
Explainability Models - Enhanced candidate explanation and audit logging
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import uuid
from datetime import datetime


class CandidateExplanation(Base):
    """
    Stores detailed explainability data for candidate-internship matches.
    Includes component scores, matched/missing skills, AI recommendations, and provenance.
    """
    __tablename__ = "candidate_explanations"

    id = Column(Integer, primary_key=True, index=True)
    explanation_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()), index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id"), nullable=False, index=True)
    
    # Overall scoring
    overall_score = Column(Float, nullable=False)  # Final score 0-100
    confidence = Column(Float, nullable=False)  # Confidence in the match 0-1
    recommendation = Column(String(20), nullable=False)  # SHORTLIST | MAYBE | REJECT
    
    # Component scores breakdown (each 0-100)
    component_scores = Column(JSON, nullable=False)  # {semantic: X, skills: Y, experience: Z, education: W, projects: V}
    
    # Skills analysis
    matched_skills = Column(JSON, nullable=True)  # [{skill, proficiency, evidence, confidence}, ...]
    missing_skills = Column(JSON, nullable=True)  # [{skill, impact, reason, recommendation}, ...]
    
    # Experience analysis
    experience_analysis = Column(JSON, nullable=True)  # {total_years, relevant_years, breakdown: [...]}
    
    # Education analysis
    education_analysis = Column(JSON, nullable=True)  # {degree, institution, match_level, gpa}
    
    # Project analysis
    project_analysis = Column(JSON, nullable=True)  # [{title, role, duration, technologies, evidence}, ...]
    
    # AI-generated recommendation
    ai_recommendation = Column(JSON, nullable=True)  # {action, priority, strengths: [...], concerns: [...], interview_questions: [...], justification, prompt, response}
    
    # Provenance metadata
    provenance = Column(JSON, nullable=True)  # {extraction_model, extract_time, data_sources: [...], llm_model}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    candidate = relationship("User", foreign_keys=[candidate_id])
    internship = relationship("Internship", foreign_keys=[internship_id])

    def __repr__(self):
        return f"<CandidateExplanation Candidate#{self.candidate_id} for Internship#{self.internship_id} - {self.recommendation}>"


class AuditLog(Base):
    """
    Tracks all ranking, filtering, and comparison actions for transparency and fairness.
    Enables audit trails and verification of recommendation integrity.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(50), unique=True, nullable=False, index=True)  # AUD-YYYY-MM-DD-XXXX format
    
    # User and action info
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # rank | explain | shortlist | compare | filter
    
    # Context
    internship_id = Column(Integer, ForeignKey("internships.id"), nullable=True, index=True)
    candidate_ids = Column(JSON, nullable=True)  # Array of candidate IDs involved
    
    # Filters and settings
    filters_applied = Column(JSON, nullable=True)  # {min_score, skills, experience_range, etc.}
    blind_mode = Column(Boolean, default=False)  # Whether PII was hidden
    
    # Verification
    result_hash = Column(String(64), nullable=True)  # SHA-256 hash of results for integrity check
    
    # Metadata
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    internship = relationship("Internship", foreign_keys=[internship_id])

    def __repr__(self):
        return f"<AuditLog {self.audit_id} - {self.action} by User#{self.user_id}>"


class FairnessCheck(Base):
    """
    Stores fairness metrics and bias detection results for candidate rankings.
    Linked to audit logs for transparency and compliance.
    """
    __tablename__ = "fairness_checks"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(50), ForeignKey("audit_logs.audit_id"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id"), nullable=False, index=True)
    
    # Check type and results
    check_type = Column(String(50), nullable=False)  # gini | disparate_impact | statistical_parity
    metric_value = Column(Float, nullable=False)  # Computed metric value
    pass_threshold = Column(Float, nullable=False)  # Threshold for passing
    passed = Column(Boolean, nullable=False)  # Whether check passed
    
    # Additional notes
    notes = Column(Text, nullable=True)  # Any additional context or warnings
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    audit_log = relationship("AuditLog", foreign_keys=[audit_id])
    internship = relationship("Internship", foreign_keys=[internship_id])

    def __repr__(self):
        return f"<FairnessCheck {self.check_type} for Audit#{self.audit_id} - {'PASS' if self.passed else 'FAIL'}>"
