"""EmailService: message building over a fake SMTP server, and the daily summary bodies."""

import email
from datetime import datetime

import pytest

from app.services import email_service as email_module
from app.services.email_service import EmailService


class FakeSMTP:
    instances = []

    def __init__(self, host, port):
        self.host, self.port = host, port
        self.started_tls = False
        self.logged_in = None
        self.sent = []
        FakeSMTP.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def starttls(self):
        self.started_tls = True

    def login(self, user, password):
        self.logged_in = (user, password)

    def send_message(self, message):
        self.sent.append(message)


@pytest.fixture
def smtp(monkeypatch):
    FakeSMTP.instances = []
    monkeypatch.setattr(email_module.smtplib, "SMTP", FakeSMTP)
    return FakeSMTP


@pytest.fixture
def service(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    monkeypatch.setenv("SMTP_PORT", "2525")
    monkeypatch.setenv("SMTP_USERNAME", "bot@skillsync.test")
    monkeypatch.setenv("SMTP_PASSWORD", "app-password")
    monkeypatch.setenv("SENDER_NAME", "SkillSync Bot")
    return EmailService()


def test_sends_html_and_text_with_login(service, smtp):
    assert service.send_email("hr@example.com", "Hello", "<b>Hi</b>", "Hi") is True

    server = smtp.instances[0]
    assert (server.host, server.port) == ("smtp.test", 2525)
    assert server.started_tls
    assert server.logged_in == ("bot@skillsync.test", "app-password")
    message = server.sent[0]
    assert message["To"] == "hr@example.com"
    assert message["From"] == "SkillSync Bot <bot@skillsync.test>"
    assert [part.get_content_type() for part in message.get_payload()] == ["text/plain", "text/html"]


def test_attachments_use_a_mixed_message(service, smtp):
    service.send_email("hr@example.com", "Report", "<p>See attached</p>", attachments=[("r.csv", b"a,b\n", "text/csv")])

    message = email.message_from_bytes(smtp.instances[0].sent[0].as_bytes())
    assert message.get_content_type() == "multipart/mixed"
    attachment = message.get_payload()[1]
    assert attachment.get_filename() == "r.csv"
    assert attachment.get_payload(decode=True) == b"a,b\n"


def test_skips_login_without_credentials(monkeypatch, smtp):
    monkeypatch.setenv("SMTP_USERNAME", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    EmailService().send_email("a@example.com", "s", "<p/>")
    assert smtp.instances[0].logged_in is None


def test_returns_false_when_smtp_fails(service, monkeypatch):
    def broken(host, port):
        raise OSError("connection refused")

    monkeypatch.setattr(email_module.smtplib, "SMTP", broken)
    assert service.send_email("a@example.com", "s", "<p/>") is False


SUMMARIES = [
    {
        "internship_title": "Backend Intern",
        "applicants": [
            {
                "name": "Asha",
                "email": "asha@example.com",
                "phone": "98765",
                "match_score": 91,
                "experience_years": 2,
                "applied_at": "2026-10-24 10:00",
                "top_skills": ["Python", "SQL"],
                "key_strengths": "APIs",
            },
            {"name": "Ravi", "email": "ravi@example.com", "match_score": 55, "applied_at": "2026-10-24 11:00"},
        ],
    }
]
DATE = datetime(2026, 10, 24)


def test_daily_summary_html_lists_each_applicant(service):
    html = service.generate_daily_summary_html("Acme", SUMMARIES, DATE)
    assert "Hello, Acme!" in html
    assert "Saturday, October 24, 2026" in html
    assert "<strong>2</strong> new application(s)" in html
    assert "Asha" in html and "ravi@example.com" in html
    assert "Key Strengths:</strong> APIs" in html


def test_daily_summary_text_lists_each_applicant(service):
    text = service.generate_daily_summary_text("Acme", SUMMARIES, DATE)
    assert "INTERNSHIP: Backend Intern" in text
    assert "1. Asha - 91% Match" in text
    assert "   Top Skills: Python, SQL" in text
    assert "2. Ravi - 55% Match" in text


def test_daily_summary_without_applicants(service):
    empty = [{"internship_title": "Intern", "applicants": []}]
    assert "No new applications" in service.generate_daily_summary_html("Acme", empty, DATE)
    assert "No new applications" in service.generate_daily_summary_text("Acme", empty, DATE)
