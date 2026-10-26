"""Reading, editing and deleting one internship by id."""

import logging

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Internship, User, UserRole
from app.routes.internship.common import router
from app.routes.internship.schemas import InternshipCreate, InternshipResponse
from app.services.parser_service import InternshipParser
from app.services.rag_engine import rag_engine
from app.utils.errors import internal_error
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)


@router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship(internship_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get internship details by ID
    """
    internship = db.query(Internship).filter(Internship.id == internship_id, Internship.is_active == 1).first()

    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    # Return internship with company name
    internship_dict = {
        "id": internship.id,
        "company_id": internship.company_id,
        "company_name": internship.company.full_name if internship.company else "Unknown Company",
        "title": internship.title,
        "description": internship.description,
        "required_skills": internship.required_skills,
        "preferred_skills": internship.preferred_skills,
        "location": internship.location,
        "duration": internship.duration,
        "stipend": internship.stipend,
        "min_experience": internship.min_experience,
        "max_experience": internship.max_experience,
        "required_education": internship.required_education,
        "is_active": internship.is_active,
        "created_at": internship.created_at,
    }

    return internship_dict


@router.put("/{internship_id}", response_model=InternshipResponse)
def update_internship(
    internship_id: int,
    internship_data: InternshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an internship posting (Company owners and Admins only)
    """
    # Get internship
    internship = db.query(Internship).filter(Internship.id == internship_id).first()

    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    # Check permissions - only company owner or admin can update
    if current_user.role != UserRole.admin and internship.company_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to update this internship"
        )

    try:
        # Parse updated data
        parsed_data = InternshipParser.parse_internship(internship_data.dict())

        # Update fields
        internship.title = parsed_data['title']
        internship.description = parsed_data['description']
        internship.required_skills = parsed_data.get('required_skills')
        internship.preferred_skills = parsed_data.get('preferred_skills')
        internship.location = parsed_data.get('location')
        internship.duration = parsed_data.get('duration')
        internship.stipend = parsed_data.get('stipend')
        internship.min_experience = parsed_data.get('min_experience')
        internship.max_experience = parsed_data.get('max_experience')
        internship.required_education = parsed_data.get('required_education')

        db.commit()
        db.refresh(internship)

        # Update embedding in vector DB
        rag_engine.store_internship_embedding(
            internship_id=str(internship.id),
            title=internship.title,
            description=internship.description,
            required_skills=internship.required_skills or [],
            metadata={
                "company_id": internship.company_id,
                "location": internship.location,
                "duration": internship.duration,
            },
        )

        return internship

    except Exception:
        db.rollback()
        raise internal_error("Error updating internship")


@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_internship(
    internship_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Delete/deactivate an internship posting (Company owners and Admins only)
    """
    # Get internship
    internship = db.query(Internship).filter(Internship.id == internship_id).first()

    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")

    # Check permissions - only company owner or admin can delete
    if current_user.role != UserRole.admin and internship.company_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this internship"
        )

    # Soft delete - just deactivate
    internship.is_active = 0
    db.commit()

    # Delete from vector DB
    rag_engine.delete_internship_embedding(str(internship.id))

    return None
