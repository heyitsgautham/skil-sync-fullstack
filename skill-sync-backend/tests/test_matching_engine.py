"""MatchingEngine scoring: each component, the weighted total, explanations and ranking."""

import pytest

from app.services.matching_engine import MatchingEngine


@pytest.fixture
def engine(fake_gemini):
    return MatchingEngine(rag_engine=None)


def test_weights_sum_to_one(engine):
    assert sum(engine.weights.values()) == pytest.approx(1.0)


def test_cosine_similarity(engine):
    assert engine._calculate_cosine_similarity([1, 0], [1, 0]) == pytest.approx(1.0)
    assert engine._calculate_cosine_similarity([1, 0], [0, 1]) == pytest.approx(0.0)


@pytest.mark.parametrize("a,b", [(None, [1]), ([], [1]), ([1], None), ([0, 0], [1, 1])])
def test_cosine_similarity_refuses_missing_or_zero_vectors(engine, a, b):
    with pytest.raises(ValueError):
        engine._calculate_cosine_similarity(a, b)


def test_skills_match_splits_required_and_preferred(engine):
    assert engine._calculate_skills_match(["Python"], []) == 100.0
    assert engine._calculate_skills_match(["python ", "SQL"], ["Python", "SQL"]) == pytest.approx(100.0)
    assert engine._calculate_skills_match(["Python"], ["Python", "SQL"]) == pytest.approx(65.0)
    assert engine._calculate_skills_match(["Python"], ["Python"], ["Docker", "AWS"]) == pytest.approx(70.0)
    assert engine._calculate_skills_match(["Python", "Docker"], ["Python"], ["Docker", "AWS"]) == pytest.approx(85.0)


def test_skills_match_accepts_substrings_both_ways(engine):
    assert engine._calculate_skills_match(["Python 3"], ["python"]) == pytest.approx(100.0)
    assert engine._calculate_skills_match(["React"], ["ReactJS"]) == pytest.approx(100.0)


@pytest.mark.parametrize(
    "years,expected",
    [(2, 100.0), (1.6, 90.0), (1.0, 70.0), (0, 50.0), (11, 85.0)],
)
def test_experience_match(engine, years, expected):
    assert engine._calculate_experience_match(years, 2, 10) == expected


def test_experience_gap_over_two_years_scores_30(engine):
    assert engine._calculate_experience_match(0, 3, 10) == 30.0


@pytest.mark.parametrize(
    "degrees,required,expected",
    [
        ([], "Bachelor", 70.0),
        ([{"degree": "B.Tech"}], "", 70.0),
        ([{"degree": "Master of Science"}], "Bachelor", 100.0),
        ([{"degree": "Bachelor of Arts"}], "Master", 80.0),
        ([{"degree": "Diploma"}], "Master", 50.0),
        ([{"degree": "Diploma"}, {"degree": "PhD"}], "Master", 100.0),
    ],
)
def test_education_match(engine, degrees, required, expected):
    assert engine._calculate_education_match(degrees, required) == expected


def test_additional_credentials_cap_at_100(engine):
    assert engine._calculate_additional_credentials([], []) == 0
    assert engine._calculate_additional_credentials([{}] * 2, [{}]) == 34
    assert engine._calculate_additional_credentials([{}] * 7, [{}] * 9) == 100


def test_matched_missing_and_gap(engine):
    assert engine._get_matched_skills(["Python", "Docker"], ["Python", "SQL"]) == ["Python"]
    assert engine._get_missing_skills(["Python"], ["Python", "SQL"]) == ["SQL"]
    assert engine._get_experience_gap(1, 3) == -2


def test_calculate_match_score_combines_components(engine):
    candidate = {
        "all_skills": ["Python", "FastAPI"],
        "total_experience_years": 1,
        "education": [{"degree": "Bachelor of Engineering"}],
        "projects": [{}, {}],
        "certifications": [],
    }
    internship = {
        "required_skills": ["Python", "FastAPI"],
        "preferred_skills": [],
        "min_experience": 0,
        "max_experience": 2,
        "required_education": "Bachelor",
    }

    result = engine.calculate_match_score(candidate, internship, [1, 0], [1, 0])

    assert result["component_scores"] == {
        "semantic_similarity": 100.0,
        "skills_match": 100.0,
        "experience_match": 100.0,
        "education_match": 100.0,
        "projects_certifications": 24,
    }
    assert result["overall_score"] == pytest.approx(92.4)
    assert result["match_details"]["matched_skills"] == ["Python", "FastAPI"]
    assert result["match_details"]["missing_skills"] == []
    assert result["match_details"]["experience_gap"] == 1


def match_result(score, matched=("Python",), missing=("SQL",)):
    return {
        "overall_score": score,
        "component_scores": {"skills_match": 50, "experience_match": 100},
        "match_details": {"matched_skills": list(matched), "missing_skills": list(missing)},
    }


def test_explanation_comes_from_gemini(engine, fake_gemini):
    fake_gemini.reply("- Strong Fit")
    text = engine.generate_match_explanation({"all_skills": ["Python"]}, {"title": "Intern"}, match_result(90))
    assert text == "- Strong Fit"
    assert "Position: Intern" in fake_gemini.prompts[0]


@pytest.mark.parametrize("score,label", [(85, "Strong Match"), (65, "Moderate Match"), (30, "Weak Match")])
def test_explanation_falls_back_when_gemini_fails(engine, fake_gemini, score, label):
    fake_gemini.reply(RuntimeError("quota"))
    text = engine.generate_match_explanation({}, {}, match_result(score))
    assert text.startswith(f"**{label}** (Score: {score}/100)")
    assert "Matched 1/2 required skills" in text
    assert "Strong in: Python" in text
    assert "Missing: SQL" in text


def test_rank_candidates_sorts_by_score_and_limits(engine, fake_gemini):
    fake_gemini.reply(RuntimeError("offline"), RuntimeError("offline"), RuntimeError("offline"))
    internship = {"title": "Intern", "required_skills": ["Python"], "embedding": [1.0, 0.0]}
    candidates = [
        {"student_id": 1, "all_skills": ["Java"], "embedding": [0.0, 1.0], "personal_info": {"name": "Low"}},
        {"student_id": 2, "all_skills": ["Python"], "embedding": [1.0, 0.0], "personal_info": {"name": "High"}},
        {"student_id": 3, "all_skills": ["Python"], "embedding": [0.6, 0.8], "personal_info": {"name": "Mid"}},
    ]

    ranked = engine.rank_candidates(candidates, internship, limit=2)

    assert [c["candidate_id"] for c in ranked] == [2, 3]
    assert ranked[0]["match_score"] > ranked[1]["match_score"]
    assert ranked[0]["candidate_name"] == "High"
    assert "Score:" in ranked[0]["explanation"]
