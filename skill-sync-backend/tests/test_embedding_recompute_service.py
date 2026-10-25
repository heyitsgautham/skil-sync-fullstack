"""EmbeddingRecomputeService: content-hash caching, recompute, and full match recalculation."""

from app.models.internship import Internship
from app.models.resume import Resume
from app.models.student_internship_match import StudentInternshipMatch
from app.services.embedding_recompute_service import EmbeddingRecomputeService as Recompute


def test_content_hash_is_sha256():
    assert Recompute.compute_content_hash("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"


def test_should_recompute_resume_rules():
    text = "Python developer"
    assert Recompute.should_recompute_resume(Resume(parsed_content="  ")) is False
    assert Recompute.should_recompute_resume(Resume(parsed_content=text)) is True
    assert Recompute.should_recompute_resume(Resume(parsed_content=text, embedding_id="resume_1")) is True
    cached = Resume(parsed_content=text, embedding_id="resume_1", content_hash=Recompute.compute_content_hash(text))
    assert Recompute.should_recompute_resume(cached) is False
    cached.parsed_content = "Python and Go developer"
    assert Recompute.should_recompute_resume(cached) is True


def test_should_recompute_internship_rules():
    internship = Internship(title="Intern", description="Python work", required_skills=["Python"])
    assert Recompute.should_recompute_internship(Internship(title="x", description="")) is False
    assert Recompute.should_recompute_internship(internship) is True
    internship.content_hash = Recompute.compute_content_hash("Intern\nPython work\nPython")
    assert Recompute.should_recompute_internship(internship) is False
    internship.description = "Go work"
    assert Recompute.should_recompute_internship(internship) is True


def test_recompute_resume_stores_the_new_vector_then_caches(db_session, seeded, fake_rag):
    resume = seeded.resumes["asha"]
    before = list(fake_rag.get_resume_embedding(str(resume.id)))
    resume.parsed_content = "React JavaScript CSS frontend developer"
    resume.extracted_skills = '["React"]'
    db_session.commit()

    first = Recompute.recompute_resume_embedding(resume, db_session)
    second = Recompute.recompute_resume_embedding(resume, db_session)

    assert first["cached"] is False and first["success"] is True
    assert second["cached"] is True
    assert list(fake_rag.get_resume_embedding(str(resume.id))) != before
    assert resume.content_hash == Recompute.compute_content_hash(resume.parsed_content)


def test_recompute_reports_failures(db_session, seeded, fake_rag, monkeypatch):
    def broken(**kwargs):
        raise RuntimeError("chroma down")

    monkeypatch.setattr(fake_rag, "store_internship_embedding", broken)
    result = Recompute.recompute_internship_embedding(seeded.backend, db_session)
    assert result == {"success": False, "cached": False, "internship_id": seeded.backend.id, "error": "chroma down"}


def test_recompute_all_counts_recomputed_then_cached(db_session, seeded):
    first = Recompute.recompute_all_embeddings(db_session)
    second = Recompute.recompute_all_embeddings(db_session)

    assert first["resumes"]["total"] == 3
    assert first["resumes"]["recomputed"] == 3
    assert first["internships"]["recomputed"] == 2
    assert second["resumes"]["cached"] == 3
    assert second["internships"]["cached"] == 2


def test_recalculate_all_matches_rebuilds_the_table(db_session, seeded):
    db_session.add(
        StudentInternshipMatch(
            student_id=seeded.students["ravi"].id, internship_id=seeded.backend.id, base_similarity_score=1
        )
    )
    db_session.commit()

    result = Recompute.recalculate_all_matches(db_session)

    assert result["successful"] == 6 and result["failed"] == 0
    rows = db_session.query(StudentInternshipMatch).all()
    assert len(rows) == 6
    best = max((r for r in rows if r.internship_id == seeded.backend.id), key=lambda r: r.base_similarity_score)
    assert best.student_id == seeded.students["asha"].id
