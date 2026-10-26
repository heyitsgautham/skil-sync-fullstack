"""Admin user management: list, update and delete users through /api/auth/users."""

import pytest

from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.models.user import User, UserRole


def reload(db_session, user_id):
    """Read the user again. The client fixture closes the session after each request, which detaches instances."""
    return db_session.query(User).filter(User.id == user_id).one()


@pytest.fixture
def admin(make_user):
    return make_user(role=UserRole.admin)


def test_admin_lists_every_user(client, admin, make_user, auth_headers):
    student = make_user(role=UserRole.student)

    response = client.get("/api/auth/users", headers=auth_headers(admin))

    assert response.status_code == 200
    by_email = {user["email"]: user for user in response.json()}
    assert set(by_email) == {admin.email, student.email}
    assert by_email[student.email]["role"] == "student"


def test_student_cannot_list_users(client, make_user, auth_headers):
    student = make_user(role=UserRole.student)
    response = client.get("/api/auth/users", headers=auth_headers(student))
    assert response.status_code == 403


def test_admin_updates_name_and_active_flag(client, admin, make_user, auth_headers, db_session):
    student = make_user(role=UserRole.student)
    student_id = student.id

    response = client.put(
        f"/api/auth/users/{student.id}",
        json={"full_name": "Renamed Student", "is_active": 0},
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Renamed Student"
    assert response.json()["is_active"] == 0
    stored = reload(db_session, student_id)
    assert stored.full_name == "Renamed Student"
    assert stored.is_active == 0


def test_role_changes_are_refused(client, admin, make_user, auth_headers, db_session):
    student = make_user(role=UserRole.student)
    student_id = student.id

    response = client.put(f"/api/auth/users/{student.id}", json={"role": "admin"}, headers=auth_headers(admin))

    assert response.status_code == 403
    assert reload(db_session, student_id).role == UserRole.student


def test_admin_cannot_deactivate_self(client, admin, auth_headers):
    response = client.put(f"/api/auth/users/{admin.id}", json={"is_active": 0}, headers=auth_headers(admin))
    assert response.status_code == 400
    assert "cannot deactivate your own account" in response.json()["detail"].lower()


def test_anonymization_toggle_applies_only_to_companies(client, admin, make_user, auth_headers, db_session):
    company = make_user(role=UserRole.company)
    student = make_user(role=UserRole.student)
    headers = auth_headers(admin)
    company_id, student_id = company.id, student.id

    response = client.put(f"/api/auth/users/{company_id}", json={"anonymization_enabled": True}, headers=headers)
    assert response.json()["anonymization_enabled"] is True
    client.put(f"/api/auth/users/{student_id}", json={"anonymization_enabled": True}, headers=headers)

    assert reload(db_session, company_id).anonymization_enabled is True
    assert not reload(db_session, student_id).anonymization_enabled


def test_update_unknown_user_returns_404(client, admin, auth_headers):
    response = client.put("/api/auth/users/999999", json={"full_name": "Ghost User"}, headers=auth_headers(admin))
    assert response.status_code == 404


def test_non_admin_cannot_update_or_delete(client, make_user, auth_headers):
    company = make_user(role=UserRole.company)
    other = make_user(role=UserRole.student)
    headers = auth_headers(company)

    assert client.put(f"/api/auth/users/{other.id}", json={"full_name": "Hacked"}, headers=headers).status_code == 403
    assert client.delete(f"/api/auth/users/{other.id}", headers=headers).status_code == 403


def test_admin_cannot_delete_self(client, admin, auth_headers):
    response = client.delete(f"/api/auth/users/{admin.id}", headers=auth_headers(admin))
    assert response.status_code == 400
    assert "cannot delete your own account" in response.json()["detail"].lower()


def test_delete_unknown_user_returns_404(client, admin, auth_headers):
    assert client.delete("/api/auth/users/999999", headers=auth_headers(admin)).status_code == 404


def test_deleting_a_student_removes_resumes_and_embeddings(
    client, admin, make_user, auth_headers, db_session, fake_rag
):
    student = make_user(role=UserRole.student)
    resume = Resume(student_id=student.id, file_path="/tmp/cv.pdf", file_name="cv.pdf")
    db_session.add(resume)
    db_session.commit()
    resume.embedding_id = fake_rag.store_resume_embedding(str(resume.id), "Python developer", ["Python"])
    db_session.commit()
    resume_id = resume.id

    response = client.delete(f"/api/auth/users/{student.id}", headers=auth_headers(admin))

    assert response.status_code == 200
    assert "1 resumes" in response.json()["message"]
    assert fake_rag.get_resume_embedding(str(resume_id)) is None
    assert db_session.query(User).filter(User.id == student.id).first() is None
    assert db_session.query(Resume).filter(Resume.student_id == student.id).count() == 0


def test_deleting_a_student_who_applied_removes_their_matches_and_applications(
    client, admin, make_user, auth_headers, db_session
):
    """On PostgreSQL the foreign keys refused this delete while matches and applications remained."""
    student = make_user(role=UserRole.student)
    company = make_user(role=UserRole.company)
    internship = Internship(company_id=company.id, title="Intern", description="d")
    resume = Resume(student_id=student.id, file_path="/tmp/cv.pdf", file_name="cv.pdf")
    db_session.add_all([internship, resume])
    db_session.commit()
    tailored = Resume(
        student_id=student.id, file_path="/tmp/t.pdf", file_name="t.pdf", is_tailored=1, base_resume_id=resume.id
    )
    db_session.add(tailored)
    db_session.commit()
    db_session.add_all(
        [
            StudentInternshipMatch(
                student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=70
            ),
            Application(student_id=student.id, internship_id=internship.id, resume_id=tailored.id),
        ]
    )
    db_session.commit()

    response = client.delete(f"/api/auth/users/{student.id}", headers=auth_headers(admin))

    assert response.status_code == 200, response.text
    assert db_session.query(User).filter(User.id == student.id).first() is None
    assert db_session.query(StudentInternshipMatch).count() == 0
    assert db_session.query(Application).count() == 0
    assert db_session.query(Internship).count() == 1


def test_deleting_a_company_removes_its_internships_with_their_applications_and_matches(
    client, admin, make_user, auth_headers, db_session, fake_rag
):
    company = make_user(role=UserRole.company)
    student = make_user(role=UserRole.student)
    internship = Internship(company_id=company.id, title="Intern", description="d")
    resume = Resume(student_id=student.id, file_path="/tmp/cv.pdf", file_name="cv.pdf")
    db_session.add_all([internship, resume])
    db_session.commit()
    db_session.add_all(
        [
            StudentInternshipMatch(
                student_id=student.id, internship_id=internship.id, resume_id=resume.id, base_similarity_score=70
            ),
            Application(student_id=student.id, internship_id=internship.id, resume_id=resume.id),
        ]
    )
    db_session.commit()
    fake_rag.store_internship_embedding(str(internship.id), "Intern", "d", [])
    internship_id = internship.id

    response = client.delete(f"/api/auth/users/{company.id}", headers=auth_headers(admin))

    assert response.status_code == 200, response.text
    assert db_session.query(Internship).count() == 0
    assert db_session.query(StudentInternshipMatch).count() == 0
    assert db_session.query(Application).count() == 0
    assert db_session.query(Resume).count() == 1
    assert fake_rag.get_internship_embedding(str(internship_id)) is None


def test_deleting_a_company_removes_its_internships(client, admin, make_user, auth_headers, db_session):
    company = make_user(role=UserRole.company)
    db_session.add(Internship(company_id=company.id, title="Backend intern", description="FastAPI work"))
    db_session.commit()

    response = client.delete(f"/api/auth/users/{company.id}", headers=auth_headers(admin))

    assert response.status_code == 200
    assert "1 internships" in response.json()["message"]
    assert db_session.query(Internship).filter(Internship.company_id == company.id).count() == 0


def test_admin_can_delete_another_admin(client, admin, make_user, auth_headers, db_session):
    second_admin = make_user(role=UserRole.admin)

    response = client.delete(f"/api/auth/users/{second_admin.id}", headers=auth_headers(admin))

    assert response.status_code == 200
    assert db_session.query(User).filter(User.role == UserRole.admin).count() == 1
