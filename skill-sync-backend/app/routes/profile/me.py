"""GET and PUT /api/profile/me: the signed-in user's own profile."""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import User, UserRole
from app.routes.profile.common import router
from app.routes.profile.schemas import ProfileUpdate
from app.utils.errors import internal_error
from app.utils.security import get_current_user


@router.get("/me", response_model=dict)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get current user's profile

    Returns profile data based on user role (student/company/admin)
    """
    if current_user.role == UserRole.student:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": current_user.phone,
            "linkedin_url": current_user.linkedin_url,
            "github_url": current_user.github_url,
            "skills": current_user.skills,
            "total_experience_years": current_user.total_experience_years,
            "role": current_user.role.value,
        }
    elif current_user.role == UserRole.company:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "hr_contact_name": current_user.hr_contact_name,
            "mailing_email": current_user.mailing_email,
            "phone": current_user.phone,
            "phone_visible": current_user.phone_visible,
            "role": current_user.role.value,
        }
    else:  # admin
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
        }


@router.put("/me", response_model=dict)
def update_my_profile(
    profile_data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile

    Students can update: full_name, phone, linkedin_url, github_url
    Companies can update: full_name, hr_contact_name, email, mailing_email, phone, phone_visible
    Admins can update: full_name
    """
    sent = profile_data.model_fields_set
    try:
        if current_user.role == UserRole.student:
            # Student profile update
            if profile_data.full_name:
                current_user.full_name = profile_data.full_name
            if 'phone' in sent:
                current_user.phone = profile_data.phone
            if 'linkedin_url' in sent:
                current_user.linkedin_url = profile_data.linkedin_url
            if 'github_url' in sent:
                current_user.github_url = profile_data.github_url

        elif current_user.role == UserRole.company:
            # Company profile update
            if profile_data.full_name:
                current_user.full_name = profile_data.full_name
            if 'hr_contact_name' in sent:
                current_user.hr_contact_name = profile_data.hr_contact_name
            if profile_data.email:
                # Check if email already exists
                existing_user = (
                    db.query(User).filter(User.email == profile_data.email, User.id != current_user.id).first()
                )
                if existing_user:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
                current_user.email = profile_data.email
            if 'mailing_email' in sent:
                current_user.mailing_email = profile_data.mailing_email
            if 'phone' in sent:
                current_user.phone = profile_data.phone
            if 'phone_visible' in sent and profile_data.phone_visible is not None:
                current_user.phone_visible = profile_data.phone_visible

        elif current_user.role == UserRole.admin:
            if profile_data.full_name:
                current_user.full_name = profile_data.full_name

        db.commit()
        db.refresh(current_user)

        # Return updated profile
        return get_my_profile(db=db, current_user=current_user)

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise internal_error("Failed to update profile")
