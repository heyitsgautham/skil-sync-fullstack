"""CandidateFlaggingService: students who share a phone, LinkedIn or GitHub are flagged."""

import pytest

from app.models.resume import Resume
from app.models.user import UserRole
from app.services.candidate_flagging_service import CandidateFlaggingService as Flags


@pytest.fixture
def student_with_resume(db_session, make_user):
    def _make(active_resume=True, **contact):
        student = make_user(role=UserRole.student, **contact)
        db_session.add(
            Resume(
                student_id=student.id,
                file_path=f"/tmp/{student.id}.pdf",
                file_name="cv.pdf",
                is_active=1 if active_resume else 0,
            )
        )
        db_session.commit()
        return student.id

    return _make


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://www.LinkedIn.com/in/asha/", "linkedin.com/in/asha"),
        ("  http://github.com/asha ", "github.com/asha"),
        ("", None),
        (None, None),
    ],
)
def test_normalize_url(raw, expected):
    assert Flags.normalize_url(raw) == expected


@pytest.mark.parametrize("raw,expected", [("+91 98765-43210", "919876543210"), ("n/a", None), (None, None)])
def test_normalize_phone(raw, expected):
    assert Flags.normalize_phone(raw) == expected


def test_flags_students_sharing_contact_details(db_session, student_with_resume):
    a = student_with_resume(phone="98765 43210", linkedin_url="https://linkedin.com/in/x")
    b = student_with_resume(phone="9876543210", github_url="github.com/shared")
    c = student_with_resume(linkedin_url="www.linkedin.com/in/x/", github_url="https://github.com/shared/")
    d = student_with_resume(phone="1112223333")

    flagged = Flags.detect_flagged_candidates(db_session)

    assert set(flagged) == {a, b, c}
    assert flagged[a]["reasons"] == ["same_mobile", "same_linkedin"]
    assert flagged[a]["flagged_with"] == {"same_mobile": [b], "same_linkedin": [c]}
    assert flagged[c]["flagged_with"] == {"same_linkedin": [a], "same_github": [b]}
    assert d not in flagged


def test_students_without_an_active_resume_are_ignored(db_session, student_with_resume, make_user):
    student_with_resume(phone="5550001111")
    student_with_resume(active_resume=False, phone="5550001111")
    make_user(role=UserRole.student, phone="5550001111")

    assert Flags.detect_flagged_candidates(db_session) == {}


def test_flag_info_for_selected_candidates(db_session, student_with_resume):
    a = student_with_resume(phone="1234567890")
    b = student_with_resume(phone="1234567890")

    info = Flags.get_flag_info_for_candidates([a, 9999], db_session)

    assert list(info) == [a]
    assert info[a]["flagged_with"]["same_mobile"] == [b]


def test_format_flag_reason():
    assert Flags.format_flag_reason(["same_mobile"]) == "Same Mobile number"
    assert Flags.format_flag_reason(["same_mobile", "same_github"]) == "Same Mobile number & GitHub"
    assert Flags.format_flag_reason(["same_mobile", "same_linkedin", "same_github"]) == (
        "Same Mobile number, LinkedIn & GitHub"
    )
