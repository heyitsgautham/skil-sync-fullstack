"""
Test configuration and fixtures
"""

import functools
import os

# Pin settings before the app modules run load_dotenv(), which walks up the
# directory tree and would otherwise pick up an unrelated .env. load_dotenv never
# overrides a variable that is already set, so empty values keep every test
# away from real Gemini, AWS, SMTP and Sentry accounts.
# TEST_DATABASE_URL runs the same suite against another database, such as the Postgres service in CI.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "sqlite:///./test.db")
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
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
    "SENTRY_DSN",
):
    os.environ[_name] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database.connection import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

SQLALCHEMY_DATABASE_URL = TEST_DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)
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
        # Share the test's session and leave it open, so objects a test created stay usable
        # after a request. The db_session fixture closes it at the end of the test.
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# The password make_user gives every test account unless a test passes its own.
TEST_PASSWORD = "test-account-password"


@functools.lru_cache
def _hash_once(password):
    """bcrypt takes about 0.2s per hash, and every test user shares a few passwords."""
    from app.utils.security import get_password_hash

    return get_password_hash(password)


@pytest.fixture
def make_user(db_session):
    """Create and persist a user with the given role."""
    from app.models.user import User, UserRole

    counter = {"n": 0}

    def _make_user(role=UserRole.student, password=TEST_PASSWORD, **fields):
        counter["n"] += 1
        user = User(
            email=fields.pop("email", f"{role.value}{counter['n']}@example.com"),
            full_name=fields.pop("full_name", f"Test {role.value.title()} {counter['n']}"),
            hashed_password=_hash_once(password),
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
    """Fail loudly if a test would load the real embedding model, and skip Gemini retry sleeps."""
    from app.services import rag_engine as rag_module
    from app.utils import gemini_key_manager

    monkeypatch.setattr(gemini_key_manager.time, "sleep", lambda seconds: None)

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


# ---------------------------------------------------------------------------
# Real document files for the parsers
# ---------------------------------------------------------------------------


def write_pdf(path, *lines):
    """Write a one-page PDF holding each line of text."""
    import fitz

    doc = fitz.open()
    page = doc.new_page()
    for index, line in enumerate(lines):
        page.insert_text((72, 72 + 18 * index), line)
    doc.save(str(path))
    doc.close()
    return path


def write_docx(path, *paragraphs):
    from docx import Document

    document = Document()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    document.save(str(path))
    return path


# ---------------------------------------------------------------------------
# A small seeded world: one company, two internships, three students
# ---------------------------------------------------------------------------


@pytest.fixture
def seeded(db_session, make_user, fake_rag, tmp_path):
    """Students with parsed resumes and stored embeddings, and a company with two internships."""
    from types import SimpleNamespace

    from app.models.internship import Internship
    from app.models.resume import Resume
    from app.models.user import UserRole

    company = make_user(role=UserRole.company, full_name="Acme Labs")
    backend = Internship(
        company_id=company.id,
        title="Backend Intern",
        description="Build FastAPI services in Python with PostgreSQL",
        required_skills=["Python", "FastAPI"],
        preferred_skills=["Docker"],
        min_experience=0,
        max_experience=2,
        required_education="Bachelor",
    )
    frontend = Internship(
        company_id=company.id,
        title="Frontend Intern",
        description="Build React pages in JavaScript",
        required_skills=["React", "JavaScript"],
    )
    db_session.add_all([backend, frontend])
    db_session.commit()
    for internship in (backend, frontend):
        fake_rag.store_internship_embedding(
            str(internship.id), internship.title, internship.description, internship.required_skills
        )

    profiles = {
        "asha": ("Python FastAPI Docker developer", ["Python", "FastAPI", "Docker"], 1.0, "Bachelor of Engineering"),
        "ravi": ("React JavaScript frontend developer", ["React", "JavaScript"], 0.5, "Bachelor of Science"),
        "meera": ("Python data analyst with SQL", ["Python", "SQL"], 3.0, "Master of Science"),
    }
    students, resumes = {}, {}
    for name, (text, skills, years, degree) in profiles.items():
        student = make_user(role=UserRole.student, full_name=name.title(), email=f"{name}@example.com", phone=None)
        path = tmp_path / f"{name}.pdf"
        write_pdf(path, name.title(), text)
        resume = Resume(
            student_id=student.id,
            file_path=str(path),
            file_name=f"{name}.pdf",
            parsed_content=text,
            extracted_skills=skills,
            parsed_data={
                "all_skills": skills,
                "total_experience_years": years,
                "education": [{"degree": degree}],
                "personal_info": {"name": name.title(), "email": f"{name}@example.com"},
            },
        )
        db_session.add(resume)
        db_session.commit()
        resume.embedding_id = fake_rag.store_resume_embedding(str(resume.id), text, skills)
        db_session.commit()
        students[name], resumes[name] = student, resume

    return SimpleNamespace(company=company, backend=backend, frontend=frontend, students=students, resumes=resumes)
