# Phase 1 Quick Reference Guide

## 🎯 What Was Built

Phase 1 created the database foundation for enhanced explainability and AI-powered job posting features.

---

## 📊 New Database Tables

### 1. `candidate_explanations`
Stores detailed match explanations for each candidate-internship pair.

**Key Fields:**
```python
explanation_id: str          # UUID
candidate_id: int           # FK to users
internship_id: int          # FK to internships
overall_score: float        # 0-100
confidence: float           # 0-1
recommendation: str         # "SHORTLIST" | "MAYBE" | "REJECT"
component_scores: dict      # {semantic, skills, experience, education, projects}
matched_skills: list        # [{skill, proficiency, evidence, confidence}]
missing_skills: list        # [{skill, impact, reason, recommendation}]
ai_recommendation: dict     # LLM-generated insights
provenance: dict            # Traceability metadata
```

**Usage Example:**
```python
from app.models import CandidateExplanation

explanation = CandidateExplanation(
    candidate_id=42,
    internship_id=15,
    overall_score=87.5,
    confidence=0.92,
    recommendation="SHORTLIST",
    component_scores={
        "semantic": 85.0,
        "skills": 90.0,
        "experience": 75.0,
        "education": 95.0,
        "projects": 88.0
    }
)
db.add(explanation)
db.commit()
```

---

### 2. `audit_logs`
Tracks all ranking, filtering, and comparison actions.

**Key Fields:**
```python
audit_id: str              # "AUD-YYYY-MM-DD-XXXX"
user_id: int              # Who performed the action
action: str               # "rank" | "explain" | "shortlist" | "compare"
internship_id: int        # Context
candidate_ids: list       # Candidates involved
filters_applied: dict     # Applied filters
blind_mode: bool          # PII hidden?
result_hash: str          # SHA-256 for integrity
```

**Usage Example:**
```python
from app.models import AuditLog
import hashlib

audit = AuditLog(
    audit_id="AUD-2025-11-06-0001",
    user_id=5,
    action="rank",
    internship_id=15,
    candidate_ids=[42, 43, 44],
    filters_applied={"min_score": 70},
    blind_mode=False,
    result_hash=hashlib.sha256(results_json.encode()).hexdigest()
)
db.add(audit)
db.commit()
```

---

### 3. `fairness_checks`
Stores bias detection and fairness metrics.

**Key Fields:**
```python
audit_id: str             # Links to AuditLog
internship_id: int
check_type: str          # "gini" | "disparate_impact" | "statistical_parity"
metric_value: float
pass_threshold: float
passed: bool
```

---

## 🔧 Enhanced Models

### `Internship` Model - 9 New Fields

```python
# Experience preferences
preferred_years: float              # Separate from min_experience

# Custom scoring weights
rubric_weights: dict               # {semantic: 0.35, skills: 0.30, ...}
skill_weights: list                # [{skill: "React", weight: 1.0, type: "must"}]

# Job details
top_responsibilities: list         # Top 3 key responsibilities
key_deliverable: str              # First 3-month goal
requires_portfolio: bool          # GitHub/portfolio required?
role_level: str                   # "Intern" | "Junior" | "Mid" | "Senior"

# AI extraction metadata
extracted_skills_raw: list        # Before HR editing
skills_extraction_confidence: dict # Confidence per skill
```

**Usage Example:**
```python
from app.models import Internship

internship = Internship(
    title="Full Stack Developer Intern",
    role_level="Intern",
    preferred_years=1.0,
    requires_portfolio=True,
    rubric_weights={
        "semantic": 0.30,
        "skills": 0.35,
        "experience": 0.20,
        "education": 0.10,
        "projects": 0.05
    },
    skill_weights=[
        {"skill": "React", "weight": 2.0, "type": "must"},
        {"skill": "Node.js", "weight": 1.5, "type": "must"},
        {"skill": "Docker", "weight": 0.8, "type": "preferred"}
    ],
    top_responsibilities=[
        "Build responsive web interfaces using React",
        "Develop RESTful APIs with Node.js",
        "Collaborate with design team on UI/UX"
    ],
    key_deliverable="Ship 2 production-ready features within first 3 months"
)
```

---

### `Resume` Model - 5 New Provenance Fields

```python
# Extraction confidence
extraction_confidence: dict        # {skills: 0.95, experience: 0.88, ...}

# Evidence snippets
skill_evidences: list             # [{skill, snippets: [{text, lines}], confidence}]
experience_evidences: list        # [{company, role, snippet, dates}]
project_evidences: list           # [{name, snippet, technologies}]

# Metadata
extraction_metadata: dict         # {model, timestamp, version, source}
```

**Usage Example:**
```python
from app.models import Resume

resume.extraction_confidence = {
    "skills": 0.95,
    "experience": 0.88,
    "education": 0.92,
    "projects": 0.87
}

resume.skill_evidences = [
    {
        "skill": "React",
        "snippets": [
            {
                "text": "Built 5 production React applications using hooks and Redux",
                "line_numbers": [45, 46]
            }
        ],
        "confidence": 0.97
    }
]

resume.extraction_metadata = {
    "model": "gemini-1.5-flash",
    "timestamp": "2025-11-06T10:30:00Z",
    "version": "1.0",
    "source": "resume_parser_v2"
}
```

---

## 🚀 Running Migrations

### Apply Phase 1 Migrations:

```bash
# 1. Internship enhancements
python scripts/migrate_job_posting_enhancements.py

# 2. Explainability tables + Resume provenance
python scripts/migrate_explainability_tables.py

# 3. Verify everything
python scripts/verify_phase1.py
```

### Rollback (if needed):

Phase 1 migrations are designed to be non-destructive. If rollback is needed:

```python
# Drop new tables
DROP TABLE IF EXISTS fairness_checks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS candidate_explanations CASCADE;

# Remove new columns from internships
ALTER TABLE internships 
  DROP COLUMN IF EXISTS preferred_years,
  DROP COLUMN IF EXISTS rubric_weights,
  DROP COLUMN IF EXISTS skill_weights,
  DROP COLUMN IF EXISTS top_responsibilities,
  DROP COLUMN IF EXISTS key_deliverable,
  DROP COLUMN IF EXISTS requires_portfolio,
  DROP COLUMN IF EXISTS role_level,
  DROP COLUMN IF EXISTS extracted_skills_raw,
  DROP COLUMN IF EXISTS skills_extraction_confidence;

# Remove new columns from resumes
ALTER TABLE resumes
  DROP COLUMN IF EXISTS extraction_confidence,
  DROP COLUMN IF EXISTS skill_evidences,
  DROP COLUMN IF EXISTS experience_evidences,
  DROP COLUMN IF EXISTS project_evidences,
  DROP COLUMN IF EXISTS extraction_metadata;
```

---

## 📝 Import Statements

```python
# All new models
from app.models import (
    CandidateExplanation,
    AuditLog,
    FairnessCheck
)

# Enhanced existing models
from app.models import Internship, Resume
```

---

## 🔍 Querying Examples

### Get all explanations for an internship:
```python
explanations = db.query(CandidateExplanation)\
    .filter(CandidateExplanation.internship_id == 15)\
    .order_by(CandidateExplanation.overall_score.desc())\
    .all()
```

### Get shortlisted candidates:
```python
shortlisted = db.query(CandidateExplanation)\
    .filter(
        CandidateExplanation.internship_id == 15,
        CandidateExplanation.recommendation == "SHORTLIST"
    )\
    .all()
```

### Get audit trail:
```python
audits = db.query(AuditLog)\
    .filter(AuditLog.internship_id == 15)\
    .order_by(AuditLog.timestamp.desc())\
    .all()
```

### Get failed fairness checks:
```python
failed_checks = db.query(FairnessCheck)\
    .filter(
        FairnessCheck.internship_id == 15,
        FairnessCheck.passed == False
    )\
    .all()
```

---

## 🎯 Next Steps for Developers

Phase 1 provides the data layer. To use these new features:

1. **Implement services** (Phase 2) to populate these tables
2. **Create API endpoints** (Phase 4) to expose the data
3. **Build UI components** (Phase 5) to display explanations
4. **Add audit logging** (Phase 6) to all ranking operations

---

## 📚 Additional Documentation

- **Full Implementation Details:** `docs/PHASE1_IMPLEMENTATION_SUMMARY.md`
- **Task Checklist:** `tasks/tasks.md` (Phase 1 section)
- **Verification Script:** `scripts/verify_phase1.py`
- **Migration Scripts:** 
  - `scripts/migrate_job_posting_enhancements.py`
  - `scripts/migrate_explainability_tables.py`

---

**Last Updated:** November 6, 2025  
**Status:** ✅ Phase 1 Complete - Ready for Phase 2
