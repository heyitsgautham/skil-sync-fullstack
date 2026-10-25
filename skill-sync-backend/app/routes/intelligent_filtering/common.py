"""Router and service singletons shared by the /api/filter route modules."""

from fastapi import APIRouter

from app.services.matching_engine import MatchingEngine
from app.services.parser_service import ResumeParser
from app.services.rag_engine import rag_engine
from app.services.resume_intelligence_service import ResumeIntelligenceService

router = APIRouter(prefix="/api/filter", tags=["intelligent-filtering"])


# Initialize services
resume_parser = ResumeParser()
intelligence_service = ResumeIntelligenceService()
matching_engine = MatchingEngine(rag_engine)
