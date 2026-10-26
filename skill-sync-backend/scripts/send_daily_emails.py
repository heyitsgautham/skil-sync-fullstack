"""
Daily Email Scheduler - Send the daily applicant summary to every company with new applications.
Run it once a day, for example from cron at midnight:

    uv run python scripts/send_daily_emails.py
"""

import logging
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.logging_config import configure_logging
from app.models import User, UserRole
from app.services.daily_summary import build_daily_summary, send_daily_summary

logger = logging.getLogger("scripts.send_daily_emails")


def send_daily_summaries(db, hours=24):
    """Email each active company that received applications in the last `hours` hours.

    Returns (emails sent, companies skipped). A failed send is logged and counted as skipped.
    """
    sent = skipped = 0
    companies = db.query(User).filter(User.role == UserRole.company, User.is_active == 1).all()
    for company in companies:
        summary = build_daily_summary(db, company, hours=hours)
        if summary is None or summary.total_applications == 0:
            skipped += 1
            continue
        if send_daily_summary(company, summary):
            sent += 1
            logger.info("Sent %d applicants to %s", summary.total_applications, company.full_name)
        else:
            skipped += 1
            logger.error("Could not send the daily summary to %s", company.full_name)
    return sent, skipped


def main():
    configure_logging()
    db = SessionLocal()
    try:
        sent, skipped = send_daily_summaries(db)
        logger.info("Daily summaries sent: %d, companies skipped: %d", sent, skipped)
    finally:
        db.close()


if __name__ == "__main__":
    main()
