"""GET /api/recommendations/candidates/{internship_id}: the vector search's best students for a posting."""

from app.models.user import UserRole

API = "/api/recommendations/candidates"


def test_ranks_the_closest_resumes_first(client, auth_headers, seeded):
    body = client.get(f"{API}/{seeded.backend.id}", headers=auth_headers(seeded.company)).json()

    assert [c["student_name"] for c in body][0] == "Asha"
    assert {c["student_name"] for c in body} == {"Asha", "Ravi", "Meera"}
    asha = body[0]
    assert asha["resume_id"] == seeded.resumes["asha"].id
    assert asha["skills"] == ["Python", "FastAPI", "Docker"]
    assert 35 <= asha["match_score"] <= 95
    assert body == sorted(body, key=lambda c: c["match_score"], reverse=True)


def test_top_k_limits_the_list(client, auth_headers, seeded):
    body = client.get(f"{API}/{seeded.backend.id}", params={"top_k": 1}, headers=auth_headers(seeded.company)).json()

    assert len(body) == 1


def test_inactive_resumes_are_left_out(client, auth_headers, seeded, db_session):
    seeded.resumes["asha"].is_active = 0
    db_session.commit()

    body = client.get(f"{API}/{seeded.backend.id}", headers=auth_headers(seeded.company)).json()

    assert "Asha" not in {c["student_name"] for c in body}


def test_other_companies_and_students_are_refused(client, make_user, auth_headers, seeded):
    other = auth_headers(make_user(role=UserRole.company))
    student = auth_headers(seeded.students["asha"])

    assert client.get(f"{API}/{seeded.backend.id}", headers=other).status_code == 404
    assert client.get(f"{API}/{seeded.backend.id}", headers=student).status_code == 403
