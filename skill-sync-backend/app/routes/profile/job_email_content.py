"""HTML and plain-text bodies for the job report email."""

from datetime import datetime
from html import escape


def generate_job_email_html(company_name, internship_title, job_stats, matches, db, applied_filters=None):
    """Generate HTML email content for job report"""
    # Names typed by people go into the HTML escaped.
    company_name, internship_title = escape(company_name), escape(internship_title)

    # Generate filter info HTML if filters were applied
    filter_info = ""
    if applied_filters and len(applied_filters) < 3:  # If not all filters selected
        filter_labels = {
            "great": "Great Matches (≥80%)",
            "good": "Good Matches (60-79%)",
            "other": "Other Matches (<60%)",
        }
        selected_filters = [filter_labels.get(f, f.upper()) for f in applied_filters]
        filter_info = f"""
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>📋 Filtered Categories:</strong> {', '.join(selected_filters)}
                <br/>
                <em style="color: #666; font-size: 13px;">This report includes only candidates from the selected match quality categories.</em>
            </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #1976d2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                background-color: #f5f5f5;
                padding: 30px;
                border-radius: 0 0 8px 8px;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 20px 0;
            }}
            .stat-card {{
                background-color: white;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #1976d2;
            }}
            .stat-number {{
                font-size: 32px;
                font-weight: bold;
                color: #1976d2;
            }}
            .stat-label {{
                color: #666;
                font-size: 14px;
            }}
            .great {{ border-left-color: #4caf50; }}
            .good {{ border-left-color: #ff9800; }}
            .bad {{ border-left-color: #f44336; }}
            .tailored {{ border-left-color: #9c27b0; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 Job Candidate Report</h1>
            <h2>{internship_title}</h2>
        </div>
        <div class="content">
            <h3>Hello, {company_name}!</h3>
            <p>Here's your comprehensive report for <strong>{internship_title}</strong>.</p>

            {filter_info}

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">{job_stats['total_applicants']}</div>
                    <div class="stat-label">Total Candidates</div>
                </div>
                <div class="stat-card great">
                    <div class="stat-number">{job_stats['great_matches']}</div>
                    <div class="stat-label">Great Matches (≥80%)</div>
                </div>
                <div class="stat-card good">
                    <div class="stat-number">{job_stats['good_matches']}</div>
                    <div class="stat-label">Good Matches (60-79%)</div>
                </div>
                <div class="stat-card bad">
                    <div class="stat-number">{job_stats['bad_matches']}</div>
                    <div class="stat-label">Other Matches (<60%)</div>
                </div>
                <div class="stat-card tailored">
                    <div class="stat-number">{job_stats['tailored_resume_count']}</div>
                    <div class="stat-label">Tailored Resumes</div>
                </div>
            </div>

            <p><strong>Note:</strong> CSV and Excel exports with detailed candidate information are attached to this email.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

            <p style="font-size: 12px; color: #666; text-align: center;">
                This is an automated report from SkillSync<br>
                Feature 7: User Profile Pages - Job Email Reports<br>
                Date: {datetime.utcnow().strftime('%B %d, %Y')}
            </p>
        </div>
    </body>
    </html>
    """
    return html


def generate_job_email_text(company_name, internship_title, job_stats):
    """Generate plain text email content for job report"""
    text = f"""
SKILLSYNC - JOB CANDIDATE REPORT
{internship_title}
{'=' * 60}

Hello, {company_name}!

Here's your comprehensive report for {internship_title}.

STATISTICS:
-----------
Total Candidates:        {job_stats['total_applicants']}
Great Matches (80%+):    {job_stats['great_matches']}
Good Matches (60-79%):   {job_stats['good_matches']}
Low Matches (<60%):      {job_stats['bad_matches']}
Tailored Resumes:        {job_stats['tailored_resume_count']}

Note: CSV export with detailed candidate information is attached to this email.

{'=' * 60}

This is an automated report from SkillSync
Feature 7: User Profile Pages - Job Email Reports
Date: {datetime.utcnow().strftime('%B %d, %Y')}
    """
    return text
