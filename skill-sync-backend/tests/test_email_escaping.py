"""Text people type reaches the HTML emails as text, never as markup.

The email builders pasted names, titles, skills and messages straight into HTML, so "Bring <your
laptop>" lost its words and anyone could inject markup into mail sent under SkillSync's name.
"""

from datetime import datetime

from app.routes.candidate_emails import generate_candidate_selection_email_html, generate_candidate_selection_email_text
from app.routes.profile.job_email_content import generate_job_email_html
from app.services.email_service import email_service

NAME = 'Asha <img src="x">'
TITLE = "C++ <Backend> Intern"
COMPANY = "R&D <Labs>"


def test_candidate_email_escapes_the_message_and_names():
    html = generate_candidate_selection_email_html(
        candidate_name=NAME, company_name=COMPANY, internship_title=TITLE, message="Bring <your laptop> & charger"
    )

    assert "Bring &lt;your laptop&gt; &amp; charger" in html
    assert "Asha &lt;img src=&quot;x&quot;&gt;" in html
    assert "C++ &lt;Backend&gt; Intern" in html
    assert "R&amp;D &lt;Labs&gt;" in html
    assert "<img" not in html and "<your laptop>" not in html


def test_plain_text_versions_keep_the_text_as_typed():
    text = generate_candidate_selection_email_text(
        candidate_name=NAME, company_name=COMPANY, internship_title=TITLE, message="Bring <your laptop> & charger"
    )

    assert "Bring <your laptop> & charger" in text
    assert NAME in text


def test_daily_summary_escapes_applicant_details():
    summaries = [
        {
            "internship_title": TITLE,
            "applicants": [
                {
                    "name": NAME,
                    "email": "asha@example.com",
                    "phone": "<b>9</b>",
                    "match_score": 80,
                    "top_skills": ["<script>alert(1)</script>"],
                    "experience_years": 1,
                    "applied_at": "Oct 26, 2026",
                    "key_strengths": "Python & <SQL>",
                }
            ],
        }
    ]

    html = email_service.generate_daily_summary_html(
        company_name=COMPANY, internship_summaries=summaries, date=datetime(2026, 10, 26)
    )

    assert "<script>" not in html and "<img" not in html and "<b>9</b>" not in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html
    assert "Python &amp; &lt;SQL&gt;" in html
    assert "C++ &lt;Backend&gt; Intern" in html
    assert "R&amp;D &lt;Labs&gt;" in html


def test_job_report_escapes_company_and_internship_names():
    stats = {"total_applicants": 0, "great_matches": 0, "good_matches": 0, "bad_matches": 0, "tailored_resume_count": 0}

    html = generate_job_email_html(COMPANY, TITLE, stats, matches=[], db=None)

    assert "C++ &lt;Backend&gt; Intern" in html
    assert "R&amp;D &lt;Labs&gt;" in html
    assert "<Backend>" not in html and "<Labs>" not in html
