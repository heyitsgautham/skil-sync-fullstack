# Changelog

All notable changes to the SkillSync Backend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 1: Enhanced Explainability & Job Posting Features - November 6, 2025

#### Added

**New Database Models:**
- `CandidateExplanation` model with 17 columns for detailed match explanations
  - Component score breakdowns (semantic, skills, experience, education, projects)
  - Matched/missing skills analysis with evidence
  - AI-generated recommendations with provenance
  - Confidence scoring and recommendation badges (SHORTLIST/MAYBE/REJECT)
  
- `AuditLog` model with 12 columns for transparency and compliance
  - Unique audit IDs in format "AUD-YYYY-MM-DD-XXXX"
  - Tracks all ranking, filtering, shortlisting, and comparison actions
  - Records filters applied and blind mode usage
  - SHA-256 result hashing for integrity verification
  
- `FairnessCheck` model with 9 columns for bias detection
  - Supports Gini coefficient, disparate impact, and statistical parity checks
  - Links to audit logs for full traceability
  - Pass/fail indicators with threshold tracking

**Internship Model Enhancements (9 new fields):**
- `preferred_years` - Preferred years of experience (separate from minimum)
- `rubric_weights` - Custom scoring weights per job posting
- `skill_weights` - Individual skill importance and types (must-have vs preferred)
- `top_responsibilities` - Top 3 key responsibilities for the role
- `key_deliverable` - First 3-month deliverable description
- `requires_portfolio` - Boolean flag for portfolio/GitHub requirement
- `role_level` - Role classification (Intern/Junior/Mid/Senior)
- `extracted_skills_raw` - Raw AI-extracted skills before HR editing
- `skills_extraction_confidence` - Confidence scores for extracted skills

**Resume Model Enhancements (5 new provenance fields):**
- `extraction_confidence` - Per-section confidence scores
- `skill_evidences` - Text snippets proving each skill with line numbers
- `experience_evidences` - Evidence for work experience claims
- `project_evidences` - Evidence for project claims
- `extraction_metadata` - Model version, timestamp, and data sources

**Migration Scripts:**
- `scripts/migrate_job_posting_enhancements.py` - Adds internship enhancements with backfilling
- `scripts/migrate_explainability_tables.py` - Creates explainability tables and resume provenance
- `scripts/verify_phase1.py` - Comprehensive verification of all Phase 1 changes

**Documentation:**
- `docs/PHASE1_IMPLEMENTATION_SUMMARY.md` - Full implementation details and verification results
- `docs/PHASE1_QUICK_REFERENCE.md` - Quick reference guide with usage examples

#### Changed
- Updated `app/models/__init__.py` to export new explainability models
- Enhanced `app/models/internship.py` with 9 new fields for intelligent matching
- Enhanced `app/models/resume.py` with 5 new provenance fields for traceability
- Updated `tasks/tasks.md` to mark Phase 1 tasks as complete

#### Database Changes
- Created 3 new tables: `candidate_explanations`, `audit_logs`, `fairness_checks`
- Added 9 new columns to `internships` table
- Added 5 new columns to `resumes` table
- Created 10 new indexes for optimal query performance
- Backfilled existing records with sensible defaults

#### Technical Details
- Total new columns: 38 (17 + 12 + 9 in new tables)
- Total enhanced columns: 14 (9 internships + 5 resumes)
- Lines of code: ~600
- All migrations tested and verified on PostgreSQL
- Zero data loss, all existing records preserved

---

## [Previous Releases]

### November 2025 - Pre-Phase 1
- Hybrid matching system with semantic + keyword search
- RAG-based resume parsing with ChromaDB
- Intelligent filtering and ranking
- S3 integration for resume storage
- Email notification system
- Student profile enhancements

---

## Migration Guide

### Applying Phase 1 Changes

```bash
# From project root
cd skill-sync-backend

# Run migrations in order
python scripts/migrate_job_posting_enhancements.py
python scripts/migrate_explainability_tables.py

# Verify
python scripts/verify_phase1.py
```

### Rollback Instructions

If rollback is needed, see `docs/PHASE1_QUICK_REFERENCE.md` for SQL commands.

---

## Breaking Changes

**None.** Phase 1 is fully backward compatible. All new fields are nullable or have defaults.

---

## Upcoming

### Phase 2: Backend Core Services (Next)
- Provenance extraction service
- Component score calculator
- Match explanation service
- Skill proficiency analyzer
- Audit log service

### Phase 3: Job Posting Skill Extraction
- AI-powered skill extraction from job descriptions
- Skill taxonomy and categorization
- Confidence-based skill highlighting

### Phase 4: Enhanced Explainability APIs
- Candidate explanation endpoints
- Comparison endpoints
- AI recommendation generation
- Precomputation service

---

**Last Updated:** November 6, 2025
