"""Router shared by the /api/internship route modules."""

from fastapi import APIRouter

router = APIRouter(prefix="/internship", tags=["Internship"])
