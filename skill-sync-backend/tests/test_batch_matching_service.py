"""BatchMatchingService pre-computes a match row for every student and internship pair."""

from app.models.student_internship_match import StudentInternshipMatch
from app.services.batch_matching_service import BatchMatchingService


def scores(db_session, internship_id):
    rows = db_session.query(StudentInternshipMatch).filter_by(internship_id=internship_id).all()
    return {row.student_id: row.base_similarity_score for row in rows}


def test_computes_every_pair(db_session, seeded):
    result = BatchMatchingService(db_session).compute_all_matches()

    assert result["students_processed"] == 3
    assert result["internships_processed"] == 2
    assert result["matches_computed"] == 6
    assert result["matches_failed"] == 0
    backend = scores(db_session, seeded.backend.id)
    assert max(backend, key=backend.get) == seeded.students["asha"].id
    frontend = scores(db_session, seeded.frontend.id)
    assert max(frontend, key=frontend.get) == seeded.students["ravi"].id


def test_recompute_for_one_student_replaces_only_their_rows(db_session, seeded):
    service = BatchMatchingService(db_session)
    service.compute_all_matches()

    result = service.compute_matches_for_student(seeded.students["asha"].id)

    assert result["matches_computed"] == 2
    assert db_session.query(StudentInternshipMatch).count() == 6


def test_recompute_for_one_internship(db_session, seeded):
    result = BatchMatchingService(db_session).compute_matches_for_internship(seeded.frontend.id)
    assert result["matches_computed"] == 3
    assert db_session.query(StudentInternshipMatch).count() == 3


def test_missing_embedding_counts_as_a_failure(db_session, seeded, fake_rag):
    fake_rag.delete_resume_embedding(str(seeded.resumes["meera"].id))

    result = BatchMatchingService(db_session).compute_all_matches()

    assert result["matches_computed"] == 4
    assert result["matches_failed"] == 2


def test_nothing_to_do_without_internships(db_session, make_user, fake_rag):
    result = BatchMatchingService(db_session).compute_all_matches()
    assert result["matches_computed"] == 0
