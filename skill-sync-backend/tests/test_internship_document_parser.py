"""InternshipDocumentParser: text extraction, Gemini parsing, normalization and fallback."""

import json

import pytest

from app.services.internship_document_parser import InternshipDocumentParser
from tests.conftest import write_docx, write_pdf

POSTING = (
    "Backend Engineering Intern\n"
    "We build APIs with Python, FastAPI and PostgreSQL. Experience with Docker is a plus. "
    "You will maintain services, write tests and ship features every week with the platform team."
)


@pytest.fixture
def parser(fake_gemini):
    return InternshipDocumentParser()


def test_reads_pdf_docx_and_txt(tmp_path):
    pdf = write_pdf(tmp_path / "jd.pdf", "Data Intern", "SQL and Python")
    docx = write_docx(tmp_path / "jd.docx", "Design Intern", "Figma")
    txt = tmp_path / "jd.txt"
    txt.write_text("  Ops Intern  ")

    assert "Data Intern" in InternshipDocumentParser.extract_text_from_file(str(pdf))
    assert "Figma" in InternshipDocumentParser.extract_text_from_file(str(docx))
    assert InternshipDocumentParser.extract_text_from_file(str(txt)) == "Ops Intern"


def test_rejects_unsupported_files(tmp_path):
    with pytest.raises(Exception, match="Unsupported file format"):
        InternshipDocumentParser.extract_text_from_file(str(tmp_path / "jd.xls"))


def test_parses_gemini_json_and_normalizes(parser, fake_gemini):
    fake_gemini.reply(
        "```json\n"
        + json.dumps(
            {
                "title": "Backend Intern",
                "description": "x" * 150,
                "required_skills": ["Python", "python", "FastAPI"],
                "preferred_skills": ["FastAPI", "Docker"],
                "min_experience": "1",
                "max_experience": 0,
                "location": "",
                "stipend": "null",
            }
        )
        + "\n```"
    )

    data = parser.extract_internship_details(POSTING)

    assert data["title"] == "Backend Intern"
    assert [s.lower() for s in data["required_skills"]] == ["python", "fastapi"]
    assert data["preferred_skills"] == ["Docker"]
    assert data["min_experience"] == 1.0
    assert data["max_experience"] == 5.0
    assert data["location"] is None
    assert data["stipend"] is None


def test_normalize_fills_title_and_description_from_the_text(parser):
    data = parser._validate_and_normalize({"title": "", "description": "short"}, POSTING)
    assert data["title"] == "Backend Engineering Intern"
    assert data["description"] == POSTING
    assert data["required_skills"] == [] and data["preferred_skills"] == []


def test_normalize_trims_skills_and_fixes_experience(parser):
    data = parser._validate_and_normalize(
        {
            "title": "Intern",
            "description": "d" * 200,
            "required_skills": [f"R{i}" for i in range(9)],
            "preferred_skills": [f"P{i}" for i in range(9)],
            "min_experience": 3,
            "max_experience": 1,
        },
        POSTING,
    )
    assert len(data["required_skills"]) == 7
    assert len(data["preferred_skills"]) == 7
    assert data["max_experience"] == 5.0


@pytest.mark.parametrize("reply", ["not json", RuntimeError("quota")])
def test_falls_back_to_keywords(parser, fake_gemini, reply):
    fake_gemini.reply(reply)

    data = parser.extract_internship_details(POSTING)

    assert data["parsing_status"] == "fallback"
    assert data["title"] == "Backend Engineering Intern"
    assert data["required_skills"] == ["Python", "PostgreSQL", "Docker"]


def test_basic_skills_keep_a_fixed_order_and_match_whole_words(parser):
    text = "We maintain a good codebase in Go and Python, and train AI models"
    assert parser._extract_skills_basic(text) == ["Python", "Go", "AI"]
    assert parser._extract_skills_basic("maintain good docs") == []


def test_parse_from_file_adds_the_original_text(parser, fake_gemini, tmp_path):
    fake_gemini.reply(json.dumps({"title": "Backend Intern", "description": POSTING, "required_skills": ["Python"]}))
    path = tmp_path / "jd.txt"
    path.write_text(POSTING)

    data = parser.parse_from_file(str(path))

    assert data["original_document_text"] == POSTING
    assert data["required_skills"] == ["Python"]


def test_parse_from_file_rejects_short_documents(parser, tmp_path):
    path = tmp_path / "jd.txt"
    path.write_text("too short")
    with pytest.raises(ValueError, match="too short"):
        parser.parse_from_file(str(path))
