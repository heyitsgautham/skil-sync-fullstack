"""
User Profile Routes - Profile management for students, companies, and admins
Feature 7: User Profile Pages
"""

# Importing each module registers its routes on the shared router.
from app.routes.profile import job_email, me  # noqa: F401
from app.routes.profile.common import router
from app.services.email_service import email_service

__all__ = ["router", "email_service"]
