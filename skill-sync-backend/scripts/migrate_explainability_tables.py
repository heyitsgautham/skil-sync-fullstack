"""
Database Migration Script: Explainability and Provenance Tables
Creates new tables for candidate explanations, audit logs, and fairness checks.
Also adds provenance fields to resumes table.
"""

import sys
import os
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import engine


def migrate_explainability_tables():
    """Create explainability and audit tables, add provenance fields to resumes"""
    
    print("🔄 Starting migration: Explainability and Provenance...")
    
    # SQL for creating new tables
    create_tables = [
        # CandidateExplanation table
        """
        CREATE TABLE IF NOT EXISTS candidate_explanations (
            id SERIAL PRIMARY KEY,
            explanation_id VARCHAR(36) UNIQUE NOT NULL,
            candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            internship_id INTEGER NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
            overall_score FLOAT NOT NULL,
            confidence FLOAT NOT NULL,
            recommendation VARCHAR(20) NOT NULL,
            component_scores JSON NOT NULL,
            matched_skills JSON,
            missing_skills JSON,
            experience_analysis JSON,
            education_analysis JSON,
            project_analysis JSON,
            ai_recommendation JSON,
            provenance JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE
        );
        """,
        
        # AuditLog table
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            audit_id VARCHAR(50) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL,
            internship_id INTEGER REFERENCES internships(id) ON DELETE SET NULL,
            candidate_ids JSON,
            filters_applied JSON,
            blind_mode BOOLEAN DEFAULT FALSE,
            result_hash VARCHAR(64),
            ip_address VARCHAR(50),
            user_agent TEXT,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
        
        # FairnessCheck table
        """
        CREATE TABLE IF NOT EXISTS fairness_checks (
            id SERIAL PRIMARY KEY,
            audit_id VARCHAR(50) NOT NULL REFERENCES audit_logs(audit_id) ON DELETE CASCADE,
            internship_id INTEGER NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
            check_type VARCHAR(50) NOT NULL,
            metric_value FLOAT NOT NULL,
            pass_threshold FLOAT NOT NULL,
            passed BOOLEAN NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]
    
    # Add provenance columns to resumes table
    add_resume_columns = [
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extraction_confidence JSON;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS skill_evidences JSON;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS experience_evidences JSON;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS project_evidences JSON;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extraction_metadata JSON;",
    ]
    
    # Create indexes for better query performance
    create_indexes = [
        # CandidateExplanation indexes
        "CREATE INDEX IF NOT EXISTS idx_candidate_explanations_candidate_id ON candidate_explanations(candidate_id);",
        "CREATE INDEX IF NOT EXISTS idx_candidate_explanations_internship_id ON candidate_explanations(internship_id);",
        "CREATE INDEX IF NOT EXISTS idx_candidate_explanations_recommendation ON candidate_explanations(recommendation);",
        
        # AuditLog indexes
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_internship_id ON audit_logs(internship_id);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);",
        
        # FairnessCheck indexes
        "CREATE INDEX IF NOT EXISTS idx_fairness_checks_audit_id ON fairness_checks(audit_id);",
        "CREATE INDEX IF NOT EXISTS idx_fairness_checks_internship_id ON fairness_checks(internship_id);",
    ]
    
    try:
        with engine.begin() as conn:
            # Create tables
            print("\n📦 Creating new tables...")
            for i, table_sql in enumerate(create_tables, 1):
                try:
                    print(f"  ✅ Creating table {i}/{len(create_tables)}...")
                    conn.execute(text(table_sql))
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"  ℹ️ Table {i} already exists, skipping...")
                    else:
                        print(f"  ⚠️ Table {i} note: {str(e)}")
                    continue
            
            # Add resume columns
            print("\n📝 Adding provenance columns to resumes table...")
            for i, migration in enumerate(add_resume_columns, 1):
                try:
                    print(f"  ✅ Adding column {i}/{len(add_resume_columns)}...")
                    conn.execute(text(migration))
                except Exception as e:
                    if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                        print(f"  ℹ️ Column {i} already exists, skipping...")
                    else:
                        print(f"  ⚠️ Column {i} note: {str(e)}")
                    continue
            
            # Create indexes
            print("\n🔍 Creating indexes...")
            for i, index_sql in enumerate(create_indexes, 1):
                try:
                    conn.execute(text(index_sql))
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"  ℹ️ Index {i} already exists, skipping...")
                    else:
                        print(f"  ⚠️ Index {i} note: {str(e)}")
                    continue
            
            print(f"  ✅ Created {len(create_indexes)} indexes successfully")
        
        print("\n✅ Migration completed successfully!")
        print("\n📊 Created tables:")
        print("  - candidate_explanations: Stores detailed match explanations")
        print("  - audit_logs: Tracks all ranking and filtering actions")
        print("  - fairness_checks: Stores bias detection results")
        print("\n📝 Added to resumes table:")
        print("  - extraction_confidence (JSON): Confidence per section")
        print("  - skill_evidences (JSON): Text snippets proving each skill")
        print("  - experience_evidences (JSON): Evidence for work experience")
        print("  - project_evidences (JSON): Evidence for projects")
        print("  - extraction_metadata (JSON): Model, timestamp, version")
        
        # Verify tables were created
        print("\n🔍 Verifying migration...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name IN ('candidate_explanations', 'audit_logs', 'fairness_checks')
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            if tables:
                print(f"  ✅ Successfully verified {len(tables)} new tables:")
                for table_name in tables:
                    print(f"     - {table_name}")
            else:
                print("  ⚠️ Could not verify tables (may not be using PostgreSQL)")
            
            # Verify resume columns
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns 
                WHERE table_name = 'resumes'
                AND column_name IN (
                    'extraction_confidence', 'skill_evidences', 
                    'experience_evidences', 'project_evidences', 'extraction_metadata'
                )
                ORDER BY column_name;
            """))
            columns = [row[0] for row in result]
            
            if columns:
                print(f"  ✅ Successfully verified {len(columns)} new resume columns:")
                for col_name in columns:
                    print(f"     - {col_name}")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    migrate_explainability_tables()
