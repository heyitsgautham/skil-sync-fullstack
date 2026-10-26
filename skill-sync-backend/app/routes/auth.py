"""
Authentication Routes
Endpoints for user registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.services.auth_service import AuthService
from app.utils.contact_fields import GitHubUrl, LinkedInUrl, Phone
from app.utils.errors import internal_error
from app.utils.security import get_current_user, get_optional_user

router = APIRouter()


# Request/Response Models
class RegisterRequest(BaseModel):
    """User registration request model"""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole

    class Config:
        use_enum_values = True


class LoginRequest(BaseModel):
    """User login request model"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response model"""

    access_token: str
    token_type: str
    user: dict


class MessageResponse(BaseModel):
    """Generic message response"""

    message: str


class UserResponse(BaseModel):
    """User information response"""

    id: int
    email: str
    full_name: str
    role: str
    is_active: int  # 1 = active, 0 = inactive
    created_at: str
    anonymization_enabled: bool | None = False  # Resume anonymization toggle (for companies)

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    """Analytics data response"""

    total_users: int
    total_students: int
    total_companies: int
    total_admins: int
    total_internships: int
    active_internships: int
    total_resumes: int
    average_match_score: float | None = None  # mean base match score in percent, None before any matches


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    caller: User | None = Depends(get_optional_user),
):
    """
    Register a new user

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **full_name**: User's full name
    - **role**: student or company for anyone; admin only when the request carries an admin's token
    """
    if request.role == UserRole.admin.value and (caller is None or caller.role != UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only an administrator can create administrator accounts"
        )
    try:
        user = AuthService.register_user(
            db=db, email=request.email, password=request.password, full_name=request.full_name, role=request.role
        )

        return MessageResponse(message=f"User registered successfully with email: {user.email}")

    except HTTPException as e:
        raise e
    except Exception:
        raise internal_error("Registration failed")


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and receive access token

    - **email**: Registered email address
    - **password**: User password

    Returns JWT access token for authenticated requests
    """
    try:
        auth_result = AuthService.authenticate_user(db=db, email=request.email, password=request.password)

        return TokenResponse(**auth_result)

    except HTTPException as e:
        raise e
    except Exception:
        raise internal_error("Login failed")


@router.get("/users", response_model=list[UserResponse])
async def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    List all users (Admin only)

    Returns a list of all registered users in the system.
    Only accessible by admin users.
    """
    # Verify user is an admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can access user list")

    try:
        users = db.query(User).all()
        return [
            UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role.value if hasattr(user.role, 'value') else user.role,
                is_active=user.is_active if user.is_active is not None else 1,
                created_at=user.created_at.isoformat() if user.created_at else "",
                anonymization_enabled=user.anonymization_enabled if hasattr(user, 'anonymization_enabled') else False,
            )
            for user in users
        ]
    except Exception:
        raise internal_error("Failed to fetch users")


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get system analytics (Admin only)

    Returns statistics about users, internships, and resumes in the system.
    Only accessible by admin users.
    """
    # Verify user is an admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can access analytics")

    try:
        from sqlalchemy import func

        from app.models.internship import Internship
        from app.models.resume import Resume
        from app.models.student_internship_match import StudentInternshipMatch

        # Count users by role
        total_users = db.query(User).count()
        total_students = db.query(User).filter(User.role == UserRole.student).count()
        total_companies = db.query(User).filter(User.role == UserRole.company).count()
        total_admins = db.query(User).filter(User.role == UserRole.admin).count()

        # Count internships
        total_internships = db.query(Internship).count()
        active_internships = db.query(Internship).filter(Internship.is_active == 1).count()

        # Count resumes
        total_resumes = db.query(Resume).filter(Resume.is_active == 1).count()

        # Mean of every pre-computed student-internship match score
        average = db.query(func.avg(StudentInternshipMatch.base_similarity_score)).scalar()
        average_match_score = round(float(average), 1) if average is not None else None

        return AnalyticsResponse(
            total_users=total_users,
            total_students=total_students,
            total_companies=total_companies,
            total_admins=total_admins,
            total_internships=total_internships,
            active_internships=active_internships,
            total_resumes=total_resumes,
            average_match_score=average_match_score,
        )
    except Exception:
        raise internal_error("Failed to fetch analytics")


class UpdateUserRequest(BaseModel):
    """Update user request model"""

    full_name: str | None = Field(None, min_length=2, max_length=255)
    role: UserRole | None = None  # Deprecated: Role changes not allowed for security
    is_active: int | None = Field(None, ge=0, le=1)
    phone: Phone = None
    linkedin_url: LinkedInUrl = None
    github_url: GitHubUrl = None
    hr_contact_name: str | None = None
    mailing_email: EmailStr | None = None
    anonymization_enabled: bool | None = None  # Admin can toggle resume anonymization for companies

    class Config:
        use_enum_values = True


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update user information (Admin only)

    - **user_id**: ID of the user to update
    - **full_name**: Updated full name (optional)
    - **is_active**: Updated active status (optional)
    - **phone**: Updated phone number (optional)
    - **linkedin_url**: Updated LinkedIn URL (optional)
    - **github_url**: Updated GitHub URL (optional)
    - **hr_contact_name**: Updated HR contact name (optional)
    - **mailing_email**: Updated mailing email (optional)

    Note: Role changes are not allowed for security reasons.
    Only accessible by admin users.
    """
    import logging

    logger = logging.getLogger(__name__)

    # Verify user is an admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can update users")

    try:
        # Get the user to update
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found")

        # Prevent admin from deactivating themselves
        if user_id == current_user.id and request.is_active == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account")

        # Prevent role changes for security reasons
        if request.role is not None:
            logger.warning(
                f"Admin {current_user.email} attempted to change role for user {user.email}. Role changes are not allowed."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role changes are not allowed. Users must be registered with the correct role.",
            )

        # Update fields if provided
        if request.full_name is not None:
            user.full_name = request.full_name
        if request.is_active is not None:
            user.is_active = request.is_active
        if request.phone is not None:
            user.phone = request.phone
        if request.linkedin_url is not None:
            user.linkedin_url = request.linkedin_url
        if request.github_url is not None:
            user.github_url = request.github_url
        if request.hr_contact_name is not None:
            user.hr_contact_name = request.hr_contact_name
        if request.mailing_email is not None:
            user.mailing_email = request.mailing_email
        if request.anonymization_enabled is not None:
            # Only allow setting anonymization for companies
            if user.role == UserRole.company:
                user.anonymization_enabled = request.anonymization_enabled
                logger.info(
                    f"Admin {current_user.email} {'enabled' if request.anonymization_enabled else 'disabled'} anonymization for company {user.email}"
                )
            else:
                logger.warning(
                    f"Admin {current_user.email} attempted to set anonymization for non-company user {user.email}"
                )

        db.commit()
        db.refresh(user)

        logger.info(f"Admin {current_user.email} updated user {user.email}")

        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, 'value') else user.role,
            is_active=user.is_active if user.is_active is not None else 1,
            created_at=user.created_at.isoformat() if user.created_at else "",
            anonymization_enabled=user.anonymization_enabled if hasattr(user, 'anonymization_enabled') else False,
        )

    except HTTPException as e:
        raise e
    except Exception:
        db.rollback()
        raise internal_error("Failed to update user")


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Delete a user (Admin only)

    - **user_id**: ID of the user to delete

    This will permanently delete the user and all associated data.
    Only accessible by admin users.

    Restrictions:
    - Cannot delete your own account
    - Cannot delete the last admin (system protection)
    - Students: Deletes resumes and all matches
    - Companies: Deletes internships and all related matches
    - Admins: Can only be deleted if there are other admins
    """
    import logging

    logger = logging.getLogger(__name__)

    # Verify user is an admin
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can delete users")

    try:
        # Get the user to delete
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found")

        # Prevent admin from deleting themselves
        if user_id == current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

        # Check if deleting an admin
        if user.role == UserRole.admin:
            # Count total admins
            admin_count = db.query(User).filter(User.role == UserRole.admin).count()

            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete the last administrator. System must have at least one admin.",
                )

            logger.warning(f"Admin {current_user.email} is deleting admin user: {user.email}")

        # Delete associated data based on user role
        deleted_data = {"resumes": 0, "internships": 0, "matches": 0}

        # Rows that reference the user's resumes or internships go before them, applications and
        # matches first, or the database's foreign keys refuse the delete.
        from app.models.application import Application
        from app.models.student_internship_match import StudentInternshipMatch
        from app.services.rag_engine import rag_engine

        if user.role == UserRole.student:
            from app.models.resume import Resume

            logger.info(f"Deleting student user: {user.email}")

            resumes = db.query(Resume).filter(Resume.student_id == user_id).all()
            embedded_resume_ids = [resume.id for resume in resumes if resume.embedding_id]

            db.query(Application).filter(Application.student_id == user_id).delete(synchronize_session=False)
            deleted_data["matches"] = (
                db.query(StudentInternshipMatch)
                .filter(StudentInternshipMatch.student_id == user_id)
                .delete(synchronize_session=False)
            )
            deleted_data["resumes"] = (
                db.query(Resume).filter(Resume.student_id == user_id).delete(synchronize_session=False)
            )

            logger.info(f"Deleted {deleted_data['resumes']} resumes and {deleted_data['matches']} matches")

        elif user.role == UserRole.company:
            from app.models.internship import Internship

            logger.info(f"Deleting company user: {user.email}")

            internship_ids = [i.id for i in db.query(Internship).filter(Internship.company_id == user_id).all()]

            if internship_ids:
                db.query(Application).filter(Application.internship_id.in_(internship_ids)).delete(
                    synchronize_session=False
                )
                deleted_data["matches"] = (
                    db.query(StudentInternshipMatch)
                    .filter(StudentInternshipMatch.internship_id.in_(internship_ids))
                    .delete(synchronize_session=False)
                )

                logger.info(f"Deleted {deleted_data['matches']} matches for {len(internship_ids)} internships")

            deleted_data["internships"] = (
                db.query(Internship).filter(Internship.company_id == user_id).delete(synchronize_session=False)
            )

            logger.info(f"Deleted {deleted_data['internships']} internships")

        elif user.role == UserRole.admin:
            logger.info(f"Deleting admin user: {user.email} (Admin count > 1)")

        # Delete the user
        user_email = user.email
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

        db.delete(user)
        db.commit()

        # Drop the vector store entries only once the rows are gone, so a failed delete keeps them.
        # delete_resume_embedding takes the resume ID, not the stored "resume_<id>" embedding ID.
        # The account is already gone, so a vector store failure is logged rather than reported.
        try:
            if user_role == UserRole.student.value:
                for resume_id in embedded_resume_ids:
                    rag_engine.delete_resume_embedding(str(resume_id))
            elif user_role == UserRole.company.value:
                for internship_id in internship_ids:
                    rag_engine.delete_internship_embedding(str(internship_id))
        except Exception:
            logger.exception(f"Deleted {user_email}, but could not remove their embeddings from ChromaDB")

        logger.info(f"✅ Successfully deleted {user_role} user: {user_email}")

        # Build detailed message
        message_parts = [f"User {user_email} ({user_role}) deleted successfully"]
        if deleted_data["resumes"] > 0:
            message_parts.append(f"{deleted_data['resumes']} resumes")
        if deleted_data["internships"] > 0:
            message_parts.append(f"{deleted_data['internships']} internships")
        if deleted_data["matches"] > 0:
            message_parts.append(f"{deleted_data['matches']} matches")

        detail_message = " - Deleted: " + ", ".join(message_parts[1:]) if len(message_parts) > 1 else ""

        return MessageResponse(message=message_parts[0] + detail_message)

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception:
        db.rollback()
        raise internal_error("Failed to delete user")
