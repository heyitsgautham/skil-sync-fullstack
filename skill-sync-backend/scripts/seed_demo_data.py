"""Seed a database with demo data: an admin, 3 companies with 3 internships each, and 53 students.

    uv run python scripts/seed_demo_data.py            # add whatever is missing
    uv run python scripts/seed_demo_data.py --reset    # drop every table first

Every account gets the password in SEED_PASSWORD, or a random one printed at the end.
Resumes are written to app/public/resumes as text files and stored unparsed, so run
scripts/force_parse_all_resumes.py afterwards to fill in the Gemini-parsed fields.
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.connection import Base, SessionLocal, engine
from app.utils.security import get_password_hash
from scripts.seed_data.seeder import RESUME_DIR, choose_password, seed


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--reset", action="store_true", help="drop and recreate every table before seeding")
    args = parser.parse_args(argv)

    password, generated = choose_password(os.environ)

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        summary = seed(db, get_password_hash(password))
    finally:
        db.close()

    print(f"Created {len(summary.created)} accounts and {summary.internships} internships.")
    if summary.skipped:
        print(f"Skipped {len(summary.skipped)} accounts that already existed.")
    print(f"Resume files are in {RESUME_DIR}.")
    print("Logins: admin@skillsync.com, hr@techcorp.com, alex.kumar@email.com, aarav.sharma@student.com and the rest.")
    if summary.created and generated:
        print(f"Every new account uses this generated password: {password}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
