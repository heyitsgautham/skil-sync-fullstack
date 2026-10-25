"""JobDescriptionAnalyzer: Gemini skill extraction, limits, and the keyword fallback."""

import json

import pytest

from app.services.job_description_analyzer import JobDescriptionAnalyzer

JD = """We are hiring a backend intern.
Required: Python, FastAPI and PostgreSQL.
Nice to have: Docker and Redis.
"""


@pytest.fixture
def analyzer(fake_gemini):
    return JobDescriptionAnalyzer()


def test_extracts_skills_from_gemini_json(analyzer, fake_gemini):
    fake_gemini.reply('```json\n{"required_skills": ["Python", "FastAPI"], "preferred_skills": ["Docker"]}\n```')

    result = analyzer.extract_skills(JD)

    assert result == {"required_skills": ["Python", "FastAPI"], "preferred_skills": ["Docker"]}
    assert JD in fake_gemini.prompts[0]


def test_drops_preferred_skills_already_required(analyzer, fake_gemini):
    fake_gemini.reply(json.dumps({"required_skills": ["Python"], "preferred_skills": ["python", "AWS"]}))
    assert analyzer.extract_skills(JD)["preferred_skills"] == ["AWS"]


def test_trims_to_seven_required_and_seven_preferred(analyzer, fake_gemini):
    required = [f"R{i}" for i in range(10)]
    preferred = [f"P{i}" for i in range(10)]
    fake_gemini.reply(json.dumps({"required_skills": required, "preferred_skills": preferred}))

    result = analyzer.extract_skills(JD)

    assert result["required_skills"] == required[:7]
    assert result["preferred_skills"] == preferred[:7]


@pytest.mark.parametrize(
    "reply",
    [RuntimeError("quota"), "", "not json", json.dumps({"required_skills": [], "preferred_skills": []})],
)
def test_falls_back_to_keywords_when_gemini_does_not_help(analyzer, fake_gemini, reply):
    fake_gemini.reply(reply)

    result = analyzer.extract_skills(JD)

    assert set(result["required_skills"]) >= {"Python", "FastAPI", "PostgreSQL"}
    assert set(result["preferred_skills"]) >= {"Docker", "Redis"}
    assert not set(result["required_skills"]) & set(result["preferred_skills"])


def test_fallback_puts_everything_in_required_without_section_hints(analyzer):
    result = analyzer._fallback_keyword_extraction("Python and Docker")
    assert set(result["required_skills"]) == {"Python", "Docker"}
    assert result["preferred_skills"] == []


def test_fallback_respects_the_limits(analyzer):
    keywords = (
        "python java javascript typescript react angular vue django flask fastapi mongodb mysql docker kubernetes aws"
    )
    text = "Required:\n" + "\n".join(keywords.split()[:9]) + "\nPreferred:\n" + "\n".join(keywords.split()[9:])

    result = analyzer._fallback_keyword_extraction(text)

    assert len(result["required_skills"]) <= 7
    assert len(result["preferred_skills"]) <= 7


def test_validate_and_enhance_returns_gemini_lists(analyzer, fake_gemini):
    fake_gemini.reply('{"required_skills": ["React"], "preferred_skills": ["Node.js"]}')
    assert analyzer.validate_and_enhance_skills(["react.js"], ["nodejs"]) == {
        "required_skills": ["React"],
        "preferred_skills": ["Node.js"],
    }


def test_validate_and_enhance_keeps_input_on_error(analyzer, fake_gemini):
    fake_gemini.reply("garbage")
    assert analyzer.validate_and_enhance_skills(["a"], ["b"]) == {"required_skills": ["a"], "preferred_skills": ["b"]}


def test_fallback_matches_whole_words_only(analyzer):
    result = analyzer._fallback_keyword_extraction("A good engineer who knows Docker and has a rapid learning curve")
    assert result["required_skills"] == ["Docker"]


def test_fallback_still_matches_symbols_and_dotted_names(analyzer):
    result = analyzer._fallback_keyword_extraction("Required: C++, C# and Node.js. R for statistics.")
    assert {"C++", "C#", "Node.js", "R"} <= set(result["required_skills"])
