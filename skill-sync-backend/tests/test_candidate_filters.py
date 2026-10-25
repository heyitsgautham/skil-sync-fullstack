"""Filters companies apply to a ranked candidate list."""

from app.services.candidate_filters import (
    CandidateFilters,
    apply_filters,
    attach_flag_info,
    highest_education_level,
)


def candidate(cid, score=70, years=1.0, skills=("Python",), degrees=()):
    return {
        'candidate_id': cid,
        'match_score': score,
        'total_experience_years': years,
        'skills': list(skills),
        'personal_info': {'education': [{'degree': d} for d in degrees]},
    }


def ids(candidates):
    return [c['candidate_id'] for c in candidates]


def test_no_filters_keeps_everyone_in_order():
    pool = [candidate(1), candidate(2), candidate(3)]
    assert ids(apply_filters(pool, CandidateFilters())) == [1, 2, 3]


def test_score_bounds_are_inclusive():
    pool = [candidate(1, score=59), candidate(2, score=60), candidate(3, score=80), candidate(4, score=81)]
    assert ids(apply_filters(pool, CandidateFilters(min_match_score=60, max_match_score=80))) == [2, 3]


def test_experience_bounds():
    pool = [candidate(1, years=0), candidate(2, years=2), candidate(3, years=5)]
    assert ids(apply_filters(pool, CandidateFilters(min_experience=1, max_experience=4))) == [2]


def test_every_requested_skill_must_match_as_a_case_insensitive_substring():
    pool = [
        candidate(1, skills=["Python", "FastAPI"]),
        candidate(2, skills=["Python"]),
        candidate(3, skills=["ReactJS", "python3"]),
    ]
    assert ids(apply_filters(pool, CandidateFilters(skills="python, fastapi"))) == [1]
    assert ids(apply_filters(pool, CandidateFilters(skills="react,PYTHON"))) == [3]


def test_highest_education_level_reads_every_degree():
    assert highest_education_level(candidate(1)) == 0
    assert highest_education_level(candidate(1, degrees=["Bachelor of Engineering"])) == 1
    assert highest_education_level(candidate(1, degrees=["Bachelor of Science", "Master of Science"])) == 2
    assert highest_education_level(candidate(1, degrees=["PhD in Physics"])) == 3
    assert highest_education_level({'candidate_id': 1}) == 0


def test_education_filter_keeps_that_level_and_above():
    pool = [
        candidate(1, degrees=["Bachelor of Arts"]),
        candidate(2, degrees=["Master of Business"]),
        candidate(3, degrees=["Doctorate"]),
        candidate(4),
    ]
    assert ids(apply_filters(pool, CandidateFilters(education_level="Master"))) == [2, 3]


def test_unknown_education_level_filters_nothing():
    pool = [candidate(1), candidate(2, degrees=["Diploma"])]
    assert ids(apply_filters(pool, CandidateFilters(education_level="Diploma"))) == [1, 2]


def test_attach_flag_info_marks_flagged_and_clean_candidates():
    pool = [candidate(1), candidate(2)]
    flag_info = {1: {'reasons': ['same_mobile'], 'flagged_with': {'same_mobile': [2]}}}

    attach_flag_info(pool, flag_info)

    assert pool[0]['is_flagged'] is True
    assert pool[0]['flag_reasons'] == ['same_mobile']
    assert pool[0]['flagged_with'] == {'same_mobile': [2]}
    assert pool[0]['flag_reason_text']
    assert pool[1]['is_flagged'] is False
    assert pool[1]['flag_reasons'] == []
    assert pool[1]['flagged_with'] == {}
    assert pool[1]['flag_reason_text'] is None


def test_describe_lists_active_filters_in_api_order():
    filters = CandidateFilters(
        min_match_score=50,
        max_match_score=90,
        min_experience=1,
        max_experience=3,
        skills="python",
        education_level="Master",
        exclude_flagged=True,
    )
    assert filters.describe() == [
        "match_score >= 50%",
        "match_score <= 90%",
        "experience >= 1 years",
        "experience <= 3 years",
        "skills contain: python",
        "education >= Master",
        "excluding flagged candidates",
    ]
    assert CandidateFilters().describe() == []
