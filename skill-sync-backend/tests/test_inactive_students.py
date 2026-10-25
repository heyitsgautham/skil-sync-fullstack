"""A student an admin deactivated must drop out of every ranking a company sees.

Each ranking path builds its own query, so each one is pinned here: discovery and applicant
ranking, the paged filtered list and the CSV export.
"""

import pytest

from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import UserRole


@pytest.fixture
def mixed_pool(db_session, make_user, auth_headers):
    """Two applicants with matches and resumes, one of them deactivated."""
    company = make_user(role=UserRole.company)
    internship = Internship(
        company_id=company.id, title="Data intern", description="Pipelines", required_skills=["Python"]
    )
    db_session.add(internship)
    db_session.commit()

    for name, active, score in (("Active Asha", 1, 70.0), ("Inactive Ravi", 0, 95.0)):
        student = make_user(role=UserRole.student, full_name=name, is_active=active)
        resume = Resume(
            student_id=student.id,
            file_path=f"/tmp/{student.id}.txt",
            file_name="cv.txt",
            is_active=1,
            parsed_data={"all_skills": ["Python"], "total_experience_years": 1},
        )
        db_session.add(resume)
        db_session.commit()
        db_session.add(
            StudentInternshipMatch(
                student_id=student.id,
                internship_id=internship.id,
                resume_id=resume.id,
                base_similarity_score=score,
                semantic_similarity=score,
                skills_match_score=score,
                experience_match_score=score,
            )
        )
        db_session.add(Application(student_id=student.id, internship_id=internship.id, resume_id=resume.id))
        db_session.commit()

    return internship.id, auth_headers(company)


@pytest.mark.parametrize("only_applicants", [False, True])
def test_rank_candidates_skips_deactivated_students(client, mixed_pool, only_applicants):
    internship_id, headers = mixed_pool

    response = client.post(
        f"/api/filter/rank-candidates/{internship_id}",
        params={"only_applicants": only_applicants, "include_explanations": False},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    assert [c["candidate_name"] for c in response.json()["ranked_candidates"]] == ["Active Asha"]


def test_filtered_ranking_skips_deactivated_students(client, mixed_pool):
    internship_id, headers = mixed_pool

    response = client.get(f"/api/filter/rank-candidates/{internship_id}/filtered", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert [c["candidate_name"] for c in body["ranked_candidates"]] == ["Active Asha"]
    assert body["total"] == 1


@pytest.mark.parametrize("export_type", ["all", "current_page"])
def test_export_skips_deactivated_students(client, mixed_pool, export_type):
    internship_id, headers = mixed_pool

    response = client.get(
        f"/api/filter/export-candidates/{internship_id}",
        params={"format": "csv", "export_type": export_type},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    assert "Active Asha" in response.text
    assert "Inactive Ravi" not in response.text
