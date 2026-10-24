#!/usr/bin/env python3
"""
Database Migration Script: Add mailing_email field to users table
Feature 7: Company Profile Enhancement - Mailing Email
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.database.connection import SessionLocal


def migrate():
    """Add mailing_email column to users table"""
    db = SessionLocal()
    try:
        print("🔄 Starting migration: Add mailing_email field...")

        # Check if column already exists (PostgreSQL)
        check_query = text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'mailing_email'
        """)

        result = db.execute(check_query)
        column_exists = result.scalar() > 0

        if column_exists:
            print("✅ mailing_email column already exists. Skipping migration.")
            return

        # Add mailing_email column (PostgreSQL syntax)
        print("📝 Adding mailing_email column...")
        add_column_query = text("""
            ALTER TABLE users 
            ADD COLUMN mailing_email VARCHAR(255) NULL
        """)
        db.execute(add_column_query)

        # Set default value for existing company accounts (use their current email)
        print("📧 Setting default mailing_email for existing companies...")
        update_query = text("""
            UPDATE users 
            SET mailing_email = email 
            WHERE role = 'company' AND mailing_email IS NULL
        """)
        db.execute(update_query)

        db.commit()
        print("✅ Migration completed successfully!")
        print("📊 Summary:")
        print("   - Added mailing_email column to users table")
        print("   - Set default values for existing companies")

    except Exception as e:
        db.rollback()
        print(f"  Migration failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
