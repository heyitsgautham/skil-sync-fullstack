"""scripts/seed_demo_data.py fills an empty database with demo accounts that can log in."""

import pytest

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.user import User, UserRole
from scripts import seed_demo_data
from scripts.seed_data import seeder

SEEDED_ACCOUNTS = 1 + 3 + 3 + 50  # admin, companies, profile students, generated students


@pytest.fixture
def seeded(db_session, tmp_path):
    summary = seeder.seed(db_session, "not-a-real-hash", resume_dir=tmp_path)
    return summary, tmp_path


def test_seed_creates_every_account_internship_and_resume(db_session, seeded):
    summary, resume_dir = seeded

    assert len(summary.created) == SEEDED_ACCOUNTS
    assert summary.internships == 9
    assert db_session.query(User).filter(User.role == UserRole.admin).count() == 1
    assert db_session.query(User).filter(User.role == UserRole.company).count() == 3
    assert db_session.query(User).filter(User.role == UserRole.student).count() == 53
    assert db_session.query(Internship).count() == 9

    resumes = db_session.query(Resume).all()
    assert len(resumes) == 53
    assert len(list(resume_dir.glob("*_resume.txt"))) == 53
    assert all(r.file_path == f"app/public/resumes/{r.file_name}" for r in resumes)
    alex = db_session.query(User).filter(User.email == "alex.kumar@email.com").one()
    alex_resume = db_session.query(Resume).filter(Resume.student_id == alex.id).one()
    assert "ALEX KUMAR" in alex_resume.parsed_content
    assert (resume_dir / "software_engineer_resume.txt").read_text() == alex_resume.parsed_content


def test_seeding_twice_adds_nothing(db_session, seeded, tmp_path):
    again = seeder.seed(db_session, "not-a-real-hash", resume_dir=tmp_path)

    assert again.created == []
    assert len(again.skipped) == SEEDED_ACCOUNTS
    assert again.internships == 0
    assert db_session.query(User).count() == SEEDED_ACCOUNTS
    assert db_session.query(Internship).count() == 9


def test_choose_password_uses_seed_password():
    assert seeder.choose_password({"SEED_PASSWORD": "correct horse"}) == ("correct horse", False)


def test_choose_password_rejects_a_short_seed_password():
    with pytest.raises(ValueError, match="at least 8"):
        seeder.choose_password({"SEED_PASSWORD": "short"})


def test_choose_password_generates_a_fresh_password_when_unset():
    first, generated = seeder.choose_password({})
    second, _ = seeder.choose_password({"SEED_PASSWORD": ""})

    assert generated is True
    assert len(first) >= 16
    assert first != second


def test_seeded_accounts_log_in_with_seed_password(client, monkeypatch, tmp_path, capsys):
    from tests.conftest import TestingSessionLocal

    monkeypatch.setenv("SEED_PASSWORD", "demo-password-1")
    monkeypatch.setattr(seed_demo_data, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(seeder, "RESUME_DIR", tmp_path)

    assert seed_demo_data.main([]) == 0
    assert "generated password" not in capsys.readouterr().out

    for email in ("admin@skillsync.com", "hr@techcorp.com", "aarav.sharma@student.com"):
        response = client.post("/api/auth/login", json={"email": email, "password": "demo-password-1"})
        assert response.status_code == 200, (email, response.text)
    wrong = client.post("/api/auth/login", json={"email": "hr@techcorp.com", "password": "TechCorp2024"})
    assert wrong.status_code == 401


def test_seed_prints_the_generated_password_once(monkeypatch, tmp_path, capsys, db_session):
    from tests.conftest import TestingSessionLocal

    monkeypatch.delenv("SEED_PASSWORD", raising=False)
    monkeypatch.setattr(seed_demo_data, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(seeder, "RESUME_DIR", tmp_path)

    seed_demo_data.main([])
    first = capsys.readouterr().out
    seed_demo_data.main([])
    second = capsys.readouterr().out

    assert "Every new account uses this generated password:" in first
    assert "generated password" not in second
    assert f"Skipped {SEEDED_ACCOUNTS} accounts" in second
