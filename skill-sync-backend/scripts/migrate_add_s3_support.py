"""
Database Migration: Add S3 support to resumes table
Adds s3_key column to store S3 object keys for cloud storage
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.database.connection import SessionLocal


def migrate_add_s3_key():
    """Add s3_key column to resumes table"""
    db = SessionLocal()

    try:
        print("🔄 Starting migration: Add S3 key support to resumes table")

        # Add s3_key column
        print("📝 Adding s3_key column...")
        db.execute(
            text("""
            ALTER TABLE resumes 
            ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500)
        """)
        )

        # Create index for faster lookups
        print("📝 Creating index on s3_key...")
        db.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_resumes_s3_key 
            ON resumes(s3_key)
        """)
        )

        db.commit()
        print("✅ Migration completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"  Migration failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_add_s3_key()
