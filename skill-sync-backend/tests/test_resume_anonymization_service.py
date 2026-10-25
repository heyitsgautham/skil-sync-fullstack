"""ResumeAnonymizationService redacts identity details from real PDFs."""

import fitz
import pytest

from app.services.resume_anonymization_service import ResumeAnonymizationService
from tests.conftest import write_pdf


@pytest.fixture
def service():
    return ResumeAnonymizationService()


@pytest.fixture
def resume_pdf(tmp_path):
    path = write_pdf(
        tmp_path / "cv.pdf",
        "Asha Raman",
        "Raman, Asha",
        "asha.raman@example.com  other.person@mail.org",
        "+91 98765 43210",
        "linkedin.com/in/asha-raman",
        "github.com/asha/skill-sync",
        "Portfolio: asha.dev",
        "Skills: Python, FastAPI, PostgreSQL",
    )
    doc = fitz.open(str(path))
    doc[0].insert_link({"kind": fitz.LINK_URI, "from": fitz.Rect(72, 60, 300, 80), "uri": "https://asha.dev"})
    doc.saveIncr()
    doc.close()
    return path


def text_of(pdf_bytes):
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        return "".join(page.get_text() for page in doc), sum(len(page.get_links()) for page in doc)


def test_redacts_identity_and_keeps_skills(service, resume_pdf):
    pdf = service.anonymize_resume_from_file(
        str(resume_pdf),
        full_name="Asha Raman",
        email="Asha.Raman@example.com",
        phone="+91 98765 43210",
        linkedin_url="https://linkedin.com/in/asha-raman",
        github_url="https://github.com/asha",
    )

    text, links = text_of(pdf)
    for secret in [
        "Asha Raman",
        "Raman, Asha",
        "@example.com",
        "@mail.org",
        "98765",
        "linkedin.com",
        "github.com",
        "Portfolio",
    ]:
        assert secret not in text, secret
    assert "Python, FastAPI, PostgreSQL" in text
    assert links == 0


def test_verify_reports_remaining_pii(service, resume_pdf, tmp_path):
    before = service.verify_anonymization(str(resume_pdf), "Asha Raman", "asha.raman@example.com")
    assert before["is_anonymized"] is False
    assert before["name_found"] and before["email_found"]
    assert before["pages_with_pii"] == [1]

    cleaned = tmp_path / "clean.pdf"
    cleaned.write_bytes(service.anonymize_resume_from_file(str(resume_pdf), "Asha Raman", "asha.raman@example.com"))
    after = service.verify_anonymization(str(cleaned), "Asha Raman", "asha.raman@example.com")
    assert after["is_anonymized"] is True


def test_redaction_patterns(service):
    patterns = service._build_redaction_patterns(
        "Asha K Raman", "A@X.com", "123", "https://linkedin.com/in/a", "http://github.com/a"
    )
    assert patterns == [
        "Asha K Raman",
        "Raman, Asha K",
        "A@X.com",
        "a@x.com",
        "123",
        "https://linkedin.com/in/a",
        "linkedin.com/in/a",
        "http://github.com/a",
        "github.com/a",
    ]
    assert service._build_redaction_patterns("", None, None, None, None) == []


def test_errors_are_wrapped(service, tmp_path):
    with pytest.raises(Exception, match="Failed to anonymize resume"):
        service.anonymize_resume_from_file(str(tmp_path / "missing.pdf"), "Asha")
    assert service.verify_anonymization(str(tmp_path / "missing.pdf"), "Asha")["is_anonymized"] is False
