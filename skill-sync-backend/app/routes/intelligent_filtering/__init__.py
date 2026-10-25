"""
Intelligent Filtering Routes - Core Intelligence System APIs
Handles resume parsing, candidate ranking, and explainable matching
"""

# Importing each module registers its routes on the shared router.
from app.routes.intelligent_filtering import (  # noqa: F401
    candidate_details,
    export,
    filtered,
    ranking,
    resume_parsing,
)
from app.routes.intelligent_filtering.common import intelligence_service, matching_engine, resume_parser, router

__all__ = ["router", "matching_engine", "intelligence_service", "resume_parser"]
