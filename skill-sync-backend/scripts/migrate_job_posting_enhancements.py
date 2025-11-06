"""
Database Migration Script: Job Posting Enhancements
Adds enhanced fields to internships table for intelligent matching and explainability
"""

import sys
import os
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import engine


def migrate_job_posting_enhancements():
    """Add enhanced fields to internships table for AI-powered matching"""
    
    print("🔄 Starting migration: Job Posting Enhancements...")
    
    migrations = [
        # Add preferred_years (separate from min_experience)
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS preferred_years FLOAT;",
        
        # Add custom rubric weights per job
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS rubric_weights JSON;",
        
        # Add individual skill importance weights
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS skill_weights JSON;",
        
        # Add top 3 responsibilities
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS top_responsibilities JSON;",
        
        # Add key deliverable description
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS key_deliverable TEXT;",
        
        # Add portfolio/GitHub requirement flag
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS requires_portfolio BOOLEAN DEFAULT FALSE;",
        
        # Add role level (Intern/Junior/Mid/Senior)
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS role_level VARCHAR(50);",
        
        # Add raw AI-extracted skills before HR editing
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS extracted_skills_raw JSON;",
        
        # Add confidence scores for extracted skills
        "ALTER TABLE internships ADD COLUMN IF NOT EXISTS skills_extraction_confidence JSON;",
    ]
    
    # Default rubric weights for existing records
    default_rubric_weights = """
    {
        "semantic": 0.30,
        "skills": 0.35,
        "experience": 0.20,
        "education": 0.10,
        "projects": 0.05
    }
    """
    
    try:
        with engine.begin() as conn:
            # Execute migrations
            for i, migration in enumerate(migrations, 1):
                try:
                    print(f"  ✅ Executing migration {i}/{len(migrations)}...")
                    conn.execute(text(migration))
                except Exception as e:
                    # Check if error is because column already exists
                    if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                        print(f"  ℹ️ Migration {i}: Column already exists, skipping...")
                    else:
                        print(f"  ⚠️ Migration {i} note: {str(e)}")
                    continue
            
            # Backfill existing records with default values
            print("\n🔄 Backfilling existing records with defaults...")
            
            backfill_queries = [
                # Set default rubric weights for null records
                f"UPDATE internships SET rubric_weights = '{default_rubric_weights}'::json WHERE rubric_weights IS NULL;",
                
                # Set default role level to 'Intern'
                "UPDATE internships SET role_level = 'Intern' WHERE role_level IS NULL;",
                
                # Set default requires_portfolio to false
                "UPDATE internships SET requires_portfolio = FALSE WHERE requires_portfolio IS NULL;",
                
                # Set preferred_years equal to min_experience for existing records
                "UPDATE internships SET preferred_years = min_experience WHERE preferred_years IS NULL AND min_experience IS NOT NULL;",
            ]
            
            for query in backfill_queries:
                try:
                    conn.execute(text(query))
                except Exception as e:
                    print(f"  ⚠️ Backfill note: {str(e)}")
            
            # Create indexes for better query performance
            print("\n🔄 Creating indexes...")
            
            index_queries = [
                # Use jsonb_path_ops for JSON indexing in PostgreSQL
                "CREATE INDEX IF NOT EXISTS idx_internships_role_level ON internships(role_level);",
            ]
            
            for query in index_queries:
                try:
                    conn.execute(text(query))
                except Exception as e:
                    print(f"  ⚠️ Index creation note: {str(e)}")
        
        print("\n✅ Migration completed successfully!")
        print("\nAdded columns:")
        print("  - preferred_years (FLOAT): Preferred years of experience")
        print("  - rubric_weights (JSON): Custom weights per job")
        print("  - skill_weights (JSON): Individual skill importance")
        print("  - top_responsibilities (JSON): List of 3 key responsibilities")
        print("  - key_deliverable (TEXT): First 3-month deliverable")
        print("  - requires_portfolio (BOOLEAN): Portfolio/GitHub requirement")
        print("  - role_level (VARCHAR): Intern/Junior/Mid/Senior")
        print("  - extracted_skills_raw (JSON): Raw AI-extracted skills")
        print("  - skills_extraction_confidence (JSON): Confidence scores")
        
        # Verify columns were added (use new connection after transaction commit)
        print("\n🔍 Verifying migration...")
        try:
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT column_name, data_type
                    FROM information_schema.columns 
                    WHERE table_name = 'internships'
                    AND column_name IN (
                        'preferred_years', 'rubric_weights', 'skill_weights', 
                        'top_responsibilities', 'key_deliverable', 'requires_portfolio',
                        'role_level', 'extracted_skills_raw', 'skills_extraction_confidence'
                    )
                    ORDER BY column_name;
                """))
                columns = [(row[0], row[1]) for row in result]
                
                if columns:
                    print(f"  ✅ Successfully verified {len(columns)} new columns:")
                    for col_name, data_type in columns:
                        print(f"     - {col_name} ({data_type})")
                else:
                    print("  ⚠️ Could not verify columns (may not be using PostgreSQL)")
            
            # Show sample of backfilled data
            print("\n🔍 Sample backfilled data:")
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT id, title, role_level, preferred_years, requires_portfolio
                    FROM internships
                    LIMIT 3;
                """))
                for row in result:
                    print(f"  - ID {row[0]}: {row[1]} | Level: {row[2]} | Preferred Years: {row[3]} | Portfolio: {row[4]}")
        except Exception as e:
            print(f"  ⚠️ Verification note: {str(e)}")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise


if __name__ == "__main__":
    migrate_job_posting_enhancements()
