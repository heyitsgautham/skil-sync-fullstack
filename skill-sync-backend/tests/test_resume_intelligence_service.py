"""ResumeIntelligenceService: Gemini resume parsing, experience totals, summaries and achievements."""

import json
from datetime import datetime

import pytest

from app.services.resume_intelligence_service import ResumeIntelligenceService


@pytest.fixture
def service(fake_gemini):
    return ResumeIntelligenceService()


def test_extracts_structured_data_and_totals(service, fake_gemini):
    fake_gemini.reply(
        "```json\n"
        + json.dumps(
            {
                "personal_info": {"name": "Asha"},
                "skills": {"technical": ["Python", "SQL", "Python"], "soft": ["Leadership"]},
                "experience": [
                    {"start_date": "2020-01", "end_date": "2021-01"},
                    {"start_date": "2022-01", "end_date": "2022-07"},
                ],
            }
        )
        + "\n```"
    )

    data = service.extract_structured_data("Asha, Python developer")

    assert data["total_experience_months"] == 18
    assert data["total_experience_years"] == 1.5
    assert sorted(data["all_skills"]) == ["Leadership", "Python", "SQL"]
    assert "Asha, Python developer" in fake_gemini.prompts[0]


@pytest.mark.parametrize("reply", ["{broken", RuntimeError("quota")])
def test_falls_back_to_regex_contact_details(service, fake_gemini, reply):
    fake_gemini.reply(reply)

    data = service.extract_structured_data("Reach me at asha@example.com or 9876543210")

    assert data["personal_info"]["email"] == "asha@example.com"
    assert data["personal_info"]["phone"] == "9876543210"
    assert data["all_skills"] == []
    assert data["summary"].startswith("Resume parsing failed")


def test_total_experience_merges_overlaps(service):
    months = service._calculate_total_experience(
        [
            {"start_date": "2020-01", "end_date": "2020-12"},
            {"start_date": "2020-06", "end_date": "2021-06"},
            {"start_date": "2019", "end_date": "2019"},
        ]
    )
    assert months == 17 + 11


def test_total_experience_handles_present_and_bad_dates(service):
    assert service._calculate_total_experience([]) == 0
    assert service._calculate_total_experience([{"start_date": "soon", "end_date": "later"}]) == 0

    start = datetime.now().replace(day=1)
    year = start.year - 1
    months = service._calculate_total_experience([{"start_date": f"{year}-{start.month:02d}", "end_date": "Present"}])
    assert months == 12


def test_summary_reuses_an_existing_one(service, fake_gemini):
    assert service.generate_candidate_summary({"summary": "Already written"}) == "Already written"
    assert fake_gemini.prompts == []


def test_summary_from_gemini_and_its_fallback(service, fake_gemini):
    fake_gemini.reply("A strong Python engineer.", RuntimeError("down"))
    profile = {"all_skills": ["Python"], "total_experience_years": 2, "education": [{"degree": "B.Tech"}]}

    assert service.generate_candidate_summary(profile) == "A strong Python engineer."
    assert "Education: B.Tech" in fake_gemini.prompts[0]
    assert service.generate_candidate_summary(profile) == "Candidate with 2 years of experience"


def test_key_achievements(service, fake_gemini):
    assert service.extract_key_achievements({}) == []
    assert service.extract_key_achievements({"experience": [{"key_achievements": []}]}) == []

    profile = {"experience": [{"key_achievements": [f"Shipped feature {i}" for i in range(7)]}]}
    fake_gemini.reply('```json\n["Shipped feature 3", "Shipped feature 5"]\n```', RuntimeError("down"))

    assert service.extract_key_achievements(profile) == ["Shipped feature 3", "Shipped feature 5"]
    assert service.extract_key_achievements(profile) == [f"Shipped feature {i}" for i in range(5)]
