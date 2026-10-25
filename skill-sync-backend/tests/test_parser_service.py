"""ResumeParser and InternshipParser on real PDF, DOCX and TXT files."""

import pytest

from app.services.parser_service import InternshipParser, ResumeParser
from tests.conftest import write_docx, write_pdf


def test_parses_a_pdf(tmp_path):
    path = write_pdf(tmp_path / "cv.pdf", "Jane Doe", "Experienced with Python, Docker and React")
    result = ResumeParser.parse_resume(str(path))
    assert result["file_type"] == ".pdf"
    assert "Jane Doe" in result["parsed_content"]
    assert {"python", "docker", "react"} <= set(result["extracted_skills"])


def test_parses_a_docx(tmp_path):
    path = write_docx(tmp_path / "cv.docx", "John Roe", "Built services with Django and PostgreSQL")
    result = ResumeParser.parse_resume(str(path))
    assert result["file_type"] == ".docx"
    assert {"django", "postgresql"} <= set(result["extracted_skills"])


def test_parses_a_txt_and_its_skills_section(tmp_path):
    path = tmp_path / "cv.txt"
    path.write_text("Summary\n\nSkills: Figma, Product Design; Kotlin\n\nEducation")
    result = ResumeParser.parse_resume(str(path))
    assert {"figma", "product design", "kotlin"} <= set(result["extracted_skills"])


def test_rejects_unknown_extensions(tmp_path):
    with pytest.raises(ValueError, match="Unsupported file format"):
        ResumeParser.parse_resume(str(tmp_path / "cv.rtf"))


@pytest.mark.parametrize(
    "reader",
    [ResumeParser.extract_text_from_pdf, ResumeParser.extract_text_from_docx, ResumeParser.extract_text_from_txt],
)
def test_readers_wrap_errors(tmp_path, reader):
    with pytest.raises(Exception, match="Error extracting text"):
        reader(str(tmp_path / "missing"))


def test_extract_skills_caps_at_50():
    text = "Skills: " + ", ".join(f"skill{i:02d}" for i in range(80))
    assert len(ResumeParser.extract_skills(text)) == 50


def test_internship_parser_defaults_skill_lists():
    assert InternshipParser.parse_internship({"title": "Intern"}) == {
        "title": "Intern",
        "required_skills": [],
        "preferred_skills": [],
    }
    assert InternshipParser.parse_internship({"required_skills": ["Go"]})["required_skills"] == ["Go"]
    assert "python" in InternshipParser.extract_skills_from_description("We use Python")
