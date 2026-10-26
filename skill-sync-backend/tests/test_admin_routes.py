"""The admin dashboard's maintenance endpoints: system status, recompute and clearing ChromaDB."""

import pytest

from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole

API = "/api/admin"


@pytest.fixture
def admin_headers(make_user, auth_headers):
    return auth_headers(make_user(role=UserRole.admin))


def test_system_status_counts_resumes_internships_and_matches(client, seeded, admin_headers):
    body = client.get(f"{API}/system-status", headers=admin_headers).json()

    assert body == {
        "resumes": {"total": 3, "base": 3, "tailored": 0, "with_embeddings": 3},
        "internships": {"total": 2, "active": 2},
        "matches": {"total": 0},
    }


def test_recompute_embeds_everything_and_computes_every_match(client, seeded, admin_headers, db_session):
    body = client.post(f"{API}/recompute-embeddings", headers=admin_headers).json()

    assert body["message"] == "Successfully recomputed embeddings and matches"
    assert body["resumes"]["total"] == 3 and body["resumes"]["failed"] == 0
    assert body["internships"]["total"] == 2 and body["internships"]["failed"] == 0
    assert body["matches"] == {"total": 6, "successful": 6, "failed": 0}
    assert db_session.query(StudentInternshipMatch).count() == 6


def test_a_second_recompute_reuses_unchanged_embeddings(client, seeded, admin_headers):
    client.post(f"{API}/recompute-embeddings", headers=admin_headers)

    body = client.post(f"{API}/recompute-embeddings", headers=admin_headers).json()

    assert body["resumes"]["cached"] == 3 and body["resumes"]["recomputed"] == 0
    assert body["internships"]["cached"] == 2 and body["internships"]["recomputed"] == 0


def test_clearing_chromadb_drops_embeddings_and_matches(client, seeded, admin_headers, db_session, fake_rag):
    client.post(f"{API}/recompute-embeddings", headers=admin_headers)

    body = client.post(f"{API}/clear-chromadb", headers=admin_headers).json()

    assert body["success"] is True
    assert body["resumes_cleared"] == 3
    assert body["postgres_cleared"] == 3
    assert body["matches_cleared"] == 6
    assert db_session.query(Resume).filter(Resume.embedding_id.isnot(None)).count() == 0
    assert db_session.query(StudentInternshipMatch).count() == 0
    assert fake_rag.get_resume_embedding(str(seeded.resumes["asha"].id)) is None


@pytest.mark.parametrize(
    "method,path",
    [("get", "system-status"), ("post", "recompute-embeddings"), ("post", "clear-chromadb")],
)
@pytest.mark.parametrize("role", [UserRole.student, UserRole.company])
def test_only_admins_reach_the_maintenance_endpoints(client, make_user, auth_headers, method, path, role):
    response = getattr(client, method)(f"{API}/{path}", headers=auth_headers(make_user(role=role)))

    assert response.status_code == 403
