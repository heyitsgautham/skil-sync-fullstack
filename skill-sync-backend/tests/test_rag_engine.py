"""RAGEngine on a temporary ChromaDB with a deterministic fake embedding model."""


def store_internships(rag):
    rag.store_internship_embedding(
        "1", "Python backend intern", "Build FastAPI services in Python", ["Python", "FastAPI"]
    )
    rag.store_internship_embedding("2", "Frontend intern", "Build React pages with JavaScript", ["React", "JavaScript"])
    rag.store_internship_embedding("3", "Data intern", "Clean data with SQL and pandas", ["SQL", "pandas"])


def test_generate_embedding_returns_a_list(fake_rag):
    vector = fake_rag.generate_embedding("python fastapi")
    assert isinstance(vector, list)
    assert len(vector) == 64


def test_store_and_read_back_embeddings(fake_rag):
    assert fake_rag.store_resume_embedding("10", "Python developer", ["Python"], {"student_id": 4}) == "resume_10"
    assert fake_rag.store_internship_embedding("7", "Intern", "Python work", ["Python"]) == "internship_7"

    assert len(fake_rag.get_resume_embedding("10")) == 64
    assert len(fake_rag.get_internship_embedding("7")) == 64
    stored = fake_rag.resume_collection.get(ids=["resume_10"])["metadatas"][0]
    assert stored["skills"] == "Python"
    assert stored["num_skills"] == 1
    assert stored["student_id"] == 4


def test_missing_embeddings_return_none(fake_rag):
    assert fake_rag.get_resume_embedding("nope") is None
    assert fake_rag.get_internship_embedding("nope") is None


def test_matching_internships_rank_the_closest_first(fake_rag):
    store_internships(fake_rag)
    fake_rag.store_resume_embedding("1", "Python backend developer who builds FastAPI services", ["Python", "FastAPI"])

    matches = fake_rag.find_matching_internships("1", top_k=3)

    assert [m["internship_id"] for m in matches][0] == "1"
    assert matches[0]["match_score"] == 95
    assert matches[-1]["match_score"] == 35
    assert matches[0]["required_skills"] == ["Python", "FastAPI"]


def test_a_single_match_scores_85(fake_rag):
    fake_rag.store_internship_embedding("1", "Intern", "Python", ["Python"])
    fake_rag.store_resume_embedding("1", "Python", ["Python"])
    assert fake_rag.find_matching_internships("1", top_k=5)[0]["match_score"] == 85


def test_matching_for_an_unknown_resume_is_empty(fake_rag):
    store_internships(fake_rag)
    assert fake_rag.find_matching_internships("missing") == []


def test_matching_candidates_rank_resumes(fake_rag):
    store_internships(fake_rag)
    fake_rag.store_resume_embedding("a", "React JavaScript pages", ["React"])
    fake_rag.store_resume_embedding("b", "SQL pandas data", ["SQL"])

    matches = fake_rag.find_matching_candidates("2", top_k=2)

    assert matches[0]["resume_id"] == "a"
    assert matches[0]["skills"] == ["React"]
    assert fake_rag.find_matching_candidates("missing") == []


def test_delete_and_clear(fake_rag):
    fake_rag.store_resume_embedding("1", "one", ["A"])
    fake_rag.store_resume_embedding("2", "two", ["B"])
    fake_rag.store_internship_embedding("9", "t", "d", ["A"])

    assert fake_rag.delete_resume_embedding("1") is True
    assert fake_rag.get_resume_embedding("1") is None
    assert fake_rag.delete_internship_embedding("9") is True
    assert fake_rag.get_internship_embedding("9") is None

    assert fake_rag.clear_all_resume_embeddings() == 1
    assert fake_rag.clear_all_resume_embeddings() == 0


def test_storing_again_replaces_the_resume_vector_and_metadata(fake_rag):
    fake_rag.store_resume_embedding("1", "python fastapi", ["Python"])
    before = fake_rag.get_resume_embedding("1")

    fake_rag.store_resume_embedding("1", "react javascript css", ["React"])

    assert list(fake_rag.get_resume_embedding("1")) != list(before)
    assert fake_rag.resume_collection.get(ids=["resume_1"])["metadatas"][0]["skills"] == "React"
    assert fake_rag.resume_collection.count() == 1


def test_storing_again_replaces_the_internship_vector(fake_rag):
    fake_rag.store_internship_embedding("5", "Backend", "python services", ["Python"])
    before = fake_rag.get_internship_embedding("5")

    fake_rag.store_internship_embedding("5", "Frontend", "react pages", ["React"])

    assert list(fake_rag.get_internship_embedding("5")) != list(before)
    assert fake_rag.internship_collection.get(ids=["internship_5"])["metadatas"][0]["title"] == "Frontend"
