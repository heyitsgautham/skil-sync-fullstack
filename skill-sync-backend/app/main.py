"""
SkillSync Backend - Main Application Entry Point
FastAPI application for intelligent internship matching platform
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import configure_logging

# Configure logging before importing the routes, so the warnings their services log at import
# time use the configured format instead of Python's bare fallback handler.
configure_logging()

from app.request_context import REQUEST_ID_HEADER, add_request_context  # noqa: E402
from app.routes import (  # noqa: E402
    admin,
    auth,
    candidate_emails,
    health,
    intelligent_filtering,
    internship,
    notifications,
    profile,
    recommendations,
    resume,
    resume_view,
    students,
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SkillSync API",
    description="Intelligent internship matching platform with AI-powered recommendations",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Try to initialize database tables (optional for initial setup)
try:
    from app.database.connection import Base, engine

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
except Exception as e:
    logger.warning(
        "Could not connect to the database, so endpoints that need it will fail. "
        "Check that PostgreSQL is running and DATABASE_URL is correct: %s",
        e,
    )


def parse_allowed_origins(value: str | None) -> list[str]:
    """Split a comma-separated ALLOWED_ORIGINS value. Unset or blank allows every origin."""
    origins = [origin.strip() for origin in (value or "").split(",") if origin.strip()]
    return origins or ["*"]


# Request IDs, access logs and the last-resort 500 handler. Added before CORS, so CORS stays the
# outermost middleware and its headers reach the 500 responses too.
add_request_context(app)

# Configure CORS from ALLOWED_ORIGINS, for example "http://localhost:3000,https://app.example.com"
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(os.getenv("ALLOWED_ORIGINS")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[REQUEST_ID_HEADER],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(resume.router, prefix="/api", tags=["Resume"])
app.include_router(resume_view.router, prefix="/api", tags=["Resume Viewing"])  # Anonymization support
app.include_router(internship.router, prefix="/api", tags=["Internship"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(intelligent_filtering.router, tags=["Intelligent Filtering"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
app.include_router(candidate_emails.router, prefix="/api", tags=["Candidate Emails"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to SkillSync API", "version": "1.0.0", "docs": "/api/docs"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
