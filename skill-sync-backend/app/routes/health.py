"""
Health Check Routes
System health and status endpoints
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/healthcheck")
async def healthcheck(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and database connectivity

    Returns 200 with database "connected" when the database answers, and 503 with database
    "unavailable" when it does not, so Docker and load balancers mark the service unhealthy.
    The database error goes to the server log rather than the response.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        logger.exception("Health check could not reach the database")
        db_status = "unavailable"

    healthy = db_status == "connected"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "healthy" if healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "SkillSync API",
            "version": "1.0.0",
            "database": db_status,
        },
    )
