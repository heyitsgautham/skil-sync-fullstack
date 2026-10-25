"""Router shared by the /api/profile route modules."""

from fastapi import APIRouter

router = APIRouter(prefix="/profile", tags=["Profile"])
