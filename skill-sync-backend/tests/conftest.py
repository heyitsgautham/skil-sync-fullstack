"""
Test configuration and fixtures
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.connection import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override"""

    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(db_session):
    """Create and persist a user with the given role."""
    from app.models.user import User, UserRole
    from app.utils.security import get_password_hash

    counter = {"n": 0}

    def _make_user(role=UserRole.student, password="password123", **fields):
        counter["n"] += 1
        user = User(
            email=fields.pop("email", f"{role.value}{counter['n']}@example.com"),
            full_name=fields.pop("full_name", f"Test {role.value.title()} {counter['n']}"),
            hashed_password=get_password_hash(password),
            role=role,
            **fields,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make_user


@pytest.fixture
def auth_headers():
    """Build an Authorization header carrying a valid JWT for a user."""
    from app.utils.security import create_access_token

    def _auth_headers(user):
        token = create_access_token({"sub": user.email, "role": user.role.value})
        return {"Authorization": f"Bearer {token}"}

    return _auth_headers
