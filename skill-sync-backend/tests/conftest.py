"""
Test configuration and fixtures
"""

import os

# Pin settings before the app modules run load_dotenv(), which walks up the
# directory tree and would otherwise pick up an unrelated .env. load_dotenv never
# overrides a variable that is already set, so empty values keep every test
# away from real Gemini, AWS and SMTP accounts.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
for _name in (
    "GOOGLE_API_KEY",
    "GEMINI_KEY_RESUME_PARSING",
    "GEMINI_KEY_MATCHING_EXPLANATION",
    "GEMINI_KEY_SKILLS_EXTRACTION",
    "GEMINI_KEY_EMBEDDING_GENERATION",
    "GEMINI_KEY_CANDIDATE_SUMMARY",
    "GEMINI_KEY_INTERNSHIP_ANALYSIS",
    "GEMINI_KEY_ACHIEVEMENT_EXTRACTION",
    "GEMINI_KEY_FALLBACK_1",
    "GEMINI_KEY_FALLBACK_2",
    "GEMINI_KEY_FALLBACK_3",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
):
    os.environ[_name] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database.connection import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

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


# ---------------------------------------------------------------------------
# Offline stand-ins for the embedding model and Gemini
# ---------------------------------------------------------------------------


class FakeEmbeddingModel:
    """Deterministic bag-of-words embedding, so similar texts get similar vectors."""

    dimension = 64

    def encode(self, text, convert_to_numpy=True):
        import hashlib

        import numpy as np

        vector = np.zeros(self.dimension)
        for token in str(text).lower().split():
            bucket = int(hashlib.md5(token.encode()).hexdigest(), 16) % self.dimension
            vector[bucket] += 1.0
        norm = np.linalg.norm(vector)
        return vector / norm if norm else vector


class FakeGemini:
    """Stands in for GeminiKeyManager. Queue replies with `reply`, inspect `prompts`."""

    def __init__(self):
        self.replies = []
        self.prompts = []

    def reply(self, *texts):
        self.replies.extend(texts)
        return self

    def _next(self, prompt):
        self.prompts.append(prompt)
        if not self.replies:
            raise RuntimeError("FakeGemini has no reply queued")
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return reply

    def generate_content(self, prompt, **kwargs):
        return self._next(prompt)

    def get_client(self, purpose="resume_parsing", max_retries=3):
        fake = self

        class _Models:
            def generate_content(self, model=None, contents=None, config=None):
                class _Response:
                    text = fake._next(contents)

                return _Response()

        class _Client:
            models = _Models()

        return _Client()


@pytest.fixture(autouse=True)
def offline_guard(monkeypatch):
    """Fail loudly if a test would load the real embedding model."""
    from app.services import rag_engine as rag_module

    def refuse():
        raise RuntimeError("This test touched the real RAGEngine. Use the fake_rag fixture.")

    monkeypatch.setattr(rag_module.rag_engine, "_engine", None)
    monkeypatch.setattr(rag_module.rag_engine, "_factory", refuse)


@pytest.fixture
def fake_gemini(monkeypatch):
    """Make get_gemini_key_manager() return a FakeGemini for services built during the test."""
    from app.utils import gemini_key_manager

    fake = FakeGemini()
    monkeypatch.setattr(gemini_key_manager, "_key_manager", fake)
    return fake


@pytest.fixture
def fake_rag(monkeypatch, tmp_path, fake_gemini):
    """A real RAGEngine on a temporary ChromaDB with a fake embedding model, shared through the lazy proxy."""
    from app.services import rag_engine as rag_module

    monkeypatch.setenv("CHROMA_DB_PATH", str(tmp_path / "chroma"))
    monkeypatch.setattr(rag_module, "SentenceTransformer", lambda name: FakeEmbeddingModel())
    engine = rag_module.RAGEngine()
    monkeypatch.setattr(rag_module.rag_engine, "_engine", engine)
    return engine
