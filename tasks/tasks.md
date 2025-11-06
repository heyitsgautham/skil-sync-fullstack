# SkillSync Enhanced Explainability & Job Posting Features - Implementation Tasks

**Created:** November 6, 2025  
**Priority:** Topologically ordered (dependencies → dependents)  
**Status:** Not Started

---

## 📋 Table of Contents
1. [Database & Model Changes](#phase-1-database--model-changes)
2. [Backend Core Services](#phase-2-backend-core-services)
3. [Job Posting Skill Extraction](#phase-3-job-posting-skill-extraction)
4. [Enhanced Explainability Backend](#phase-4-enhanced-explainability-backend)
5. [Frontend Components & UI](#phase-5-frontend-components--ui)
6. [Audit & Fairness Features](#phase-6-audit--fairness-features-optional)
7. [Advanced Features](#phase-7-advanced-features-nice-to-have)

---

## Phase 1: Database & Model Changes ✅ COMPLETE
**Dependencies:** None  
**Why First:** All other features depend on the data model  
**Status:** ✅ Completed on November 6, 2025

### Task 1.1: Create Database Migration for Internship Model Enhancements ✅
**File:** `skill-sync-backend/scripts/migrate_job_posting_enhancements.py`

**Add to `Internship` model:**
- [x] `preferred_years` (Float) - Preferred years of experience (separate from min)
- [x] `rubric_weights` (JSON) - Custom weights per job: `{semantic: 0.35, skills: 0.30, experience: 0.20, education: 0.10, projects: 0.05}`
- [x] `skill_weights` (JSON) - Individual skill importance: `[{skill: "React", weight: 1.0, type: "must"}, ...]`
- [x] `top_responsibilities` (JSON) - List of 3 key responsibilities
- [x] `key_deliverable` (Text) - First 3-month deliverable description
- [x] `requires_portfolio` (Boolean) - Whether portfolio/GitHub is required
- [x] `role_level` (String) - Intern/Junior/Mid/Senior
- [x] `extracted_skills_raw` (JSON) - Raw AI-extracted skills before HR editing
- [x] `skills_extraction_confidence` (JSON) - Confidence scores for each extracted skill

**Migration Script:** ✅ Implemented and executed successfully
- Added all 9 columns to internships table
- Backfilled existing records with defaults
- Created indexes for better query performance
- Verified all columns present and accessible

### Task 1.2: Create Explainability Models ✅
**File:** `skill-sync-backend/app/models/explainability.py`

Create new models:
- [x] **`CandidateExplanation` table:**
  - `id`, `candidate_id`, `internship_id`, `overall_score`, `confidence` ✅
  - `recommendation` (SHORTLIST/MAYBE/REJECT) ✅
  - `component_scores` (JSON) - semantic, skills, experience, education, projects ✅
  - `matched_skills` (JSON) - with proficiency, evidence, confidence ✅
  - `missing_skills` (JSON) - with impact, reason, recommendation ✅
  - `experience_analysis` (JSON) - total_years, relevant_years, breakdown ✅
  - `education_analysis` (JSON) ✅
  - `project_analysis` (JSON) ✅
  - `ai_recommendation` (JSON) - action, priority, justification, prompt, response ✅
  - `provenance` (JSON) - extraction_model, extract_time, data_sources ✅
  - `created_at`, `updated_at` ✅

- [x] **`AuditLog` table:**
  - `id`, `audit_id` (unique, e.g., AUD-2025-11-06-001) ✅
  - `user_id`, `action` (rank/explain/shortlist/compare) ✅
  - `internship_id`, `candidate_ids` (JSON array) ✅
  - `filters_applied` (JSON), `blind_mode` (Boolean) ✅
  - `result_hash` (String) - hash of results for verification ✅
  - `timestamp`, `ip_address`, `user_agent` ✅

- [x] **`FairnessCheck` table:**
  - `id`, `audit_id` (FK to AuditLog) ✅
  - `internship_id`, `check_type` (gini/disparate_impact/statistical_parity) ✅
  - `metric_value` (Float), `pass_threshold` (Float) ✅
  - `passed` (Boolean), `notes` (Text) ✅
  - `created_at` ✅

**Migration Script:** ✅ `scripts/migrate_explainability_tables.py` executed successfully
- Created all 3 tables with 38 total columns
- Added 10 indexes for optimal query performance
- All tables verified and accessible

### Task 1.3: Add Provenance Fields to Resume Model ✅
**File:** `skill-sync-backend/app/models/resume.py`

Add fields:
- [x] `extraction_confidence` (JSON) - confidence per section (skills, experience, education)
- [x] `skill_evidences` (JSON) - snippets that prove each skill with line numbers
- [x] `experience_evidences` (JSON) - raw text snippets for each job
- [x] `project_evidences` (JSON) - raw text snippets for each project
- [x] `extraction_metadata` (JSON) - model used, timestamp, version

**Migration Script:** ✅ Included in `scripts/migrate_explainability_tables.py`
- All 5 provenance fields added successfully
- Fields verified and accessible on resumes table

---

## Phase 2: Backend Core Services ✅ COMPLETE
**Dependencies:** Phase 1 (Database Models)
**Status:** ✅ Completed on November 6, 2025

### Task 2.1: Implement Provenance Extraction Service ✅
**File:** `skill-sync-backend/app/services/provenance_service.py`

Create functions:
- [x] `extract_skill_provenance(resume_text, skills)` → Returns snippets with line numbers
- [x] `extract_experience_provenance(resume_text, experiences)` → Returns date ranges + snippets
- [x] `extract_project_provenance(resume_text, projects)` → Returns project descriptions + tech stacks
- [x] `calculate_extraction_confidence(evidences)` → Returns confidence score 0-1
- [x] `store_provenance(resume_id, provenances)` → Saves to database

**Implementation:** ✅ Uses Gemini API to identify exact text spans with confidence scores

### Task 2.2: Implement Component Score Calculator Service ✅
**File:** `skill-sync-backend/app/services/component_score_service.py`

Create functions:
- [x] `calculate_semantic_score(resume_embedding, job_embedding)` → 0-100
- [x] `calculate_skills_score(candidate_skills, required_skills, preferred_skills, skill_weights)` → 0-100
  - Handles exact match, fuzzy match (fuzzywuzzy), proficiency weighting
  - Returns matched_skills list and missing_skills list with impact ratings
- [x] `calculate_experience_score(candidate_exp, min_years, preferred_years)` → 0-100
  - Calculates relevant_years from roles mentioning required skills
- [x] `calculate_education_score(candidate_edu, required_edu)` → 0-100
- [x] `calculate_projects_score(candidate_projects, required_skills)` → 0-100
- [x] `calculate_final_score(component_scores, rubric_weights)` → 0-100
- [x] `generate_confidence_score(component_confidences)` → 0-1

**Testing:** ✅ All functions tested with sample data, scores calculated correctly

### Task 2.3: Enhance Match Explanation Service ✅
**File:** `skill-sync-backend/app/services/match_explanation_service.py`

Implement full explainability:
- [x] `generate_explanation(candidate_id, internship_id)` → CandidateExplanation object
  - Fetches resume with provenance
  - Fetches internship with requirements
  - Calculates all component scores with evidence
  - Generates AI recommendation paragraph using Gemini
  - Stores provenance (model, timestamp, data sources)
  - Returns structured explanation JSON
  
- [x] `generate_comparison_explanation(candidate_id_1, candidate_id_2, internship_id)` → Comparison object
  - Side-by-side component scores
  - Highlights decisive differences
  - Generates natural language summary ("Why A > B")
  - Actionable next steps for each candidate

- [x] `generate_short_reason(explanation)` → One-sentence summary for card header

**Features:** ✅ Comprehensive explanations with AI recommendations, comparison analysis, and provenance

### Task 2.4: Implement Skill Proficiency Analyzer ✅
**File:** `skill-sync-backend/app/services/skill_proficiency_service.py`

Create functions:
- [x] `calculate_proficiency(skill, resume_data)` → Expert/Advanced/Intermediate/Beginner
  - Years of experience with skill (from roles/projects): 0-10 years
  - Number of projects using skill: 0-N
  - Certifications: Boolean
  - Formula: `proficiency = 0.5*norm(years) + 0.3*norm(projects) + 0.2*cert_flag`
- [x] `map_proficiency_score(proficiency_value)` → String label
- [x] `get_skill_evidence(skill, resume_text, resume_data)` → List of evidence objects

**Testing:** ✅ Proficiency levels calculated correctly with evidence extraction

### Task 2.5: Create Audit Log Service ✅
**File:** `skill-sync-backend/app/services/audit_service.py`

Implement:
- [x] `create_audit_log(user_id, action, internship_id, candidate_ids, filters, blind_mode)` → audit_id
- [x] `generate_audit_id()` → "AUD-YYYY-MM-DD-XXXX" format
- [x] `calculate_result_hash(results)` → SHA-256 hash
- [x] `get_audit_trail(internship_id)` → List of audit logs
- [x] `verify_audit_integrity(audit_id)` → Boolean (check hash)
- [x] `get_audit_statistics()` → Audit usage statistics

**Testing:** ✅ Audit IDs generated correctly, hash integrity verified (SHA-256)

---

## Phase 3: Job Posting Skill Extraction ✅ COMPLETE
**Dependencies:** Phase 2 (Component Score Service for skill taxonomy)
**Status:** ✅ Completed on November 6, 2025

### Task 3.1: Create Skill Taxonomy Service ✅
**File:** `skill-sync-backend/app/services/skill_taxonomy_service.py`

Build skill vocabulary:
- [x] Load comprehensive skill list (tech + soft skills)
- [x] Create skill categorization: `{skill: {category: "Frontend/Backend/Database/Soft", aliases: [...]}}`
- [x] `find_skill_matches(text)` → Fuzzy match skills in text
- [x] `categorize_skill(skill_name)` → Category
- [x] `get_skill_aliases(skill_name)` → List of alternatives

**Data source:** Created `data/skill_taxonomy.json` with 120+ common skills ✅

### Task 3.2: Implement AI Skill Extraction Service ✅
**File:** `skill-sync-backend/app/services/skill_extraction_service.py`

Create functions:
- [x] `extract_skills_from_description(title, description, num_suggestions=15)` → List of skills with confidence
  - Uses Gemini API (gemini-2.5-flash) with structured JSON schema for guaranteed valid output
  - Returns skills sorted by confidence
  - Includes text span positions for highlighting
  - Fallback to taxonomy-based extraction if AI fails

- [x] `highlight_skills_in_text(description, extracted_skills)` → HTML with highlighted spans
  - Generates HTML with `<mark class="skill-highlight-{confidence}">skill</mark>`
  - Different colors for confidence levels: High (>0.8), Medium (0.6-0.8), Low (<0.6)

- [x] `categorize_extracted_skills(skills, required_threshold=0.8)` → {must_have: [], preferred: []}
  - Auto-suggests must_have for confidence > 0.8
  - Auto-suggests preferred for 0.6 < confidence <= 0.8

### Task 3.3: Create Job Posting Skill Extraction API Endpoint ✅
**File:** `skill-sync-backend/app/routes/internship.py`

Added endpoint:
- [x] **POST `/api/internship/extract-skills`**
  - Input: `{title, description, num_suggestions}`
  - Process: Calls skill extraction service with Gemini AI
  - Output: 
    ```json
    {
      "skills": [
        {"skill": "React", "confidence": 0.97, "category": "Frontend", "span": [45, 50], "in_taxonomy": true},
        ...
      ],
      "suggested_must_have": ["React", "Node.js", ...],
      "suggested_preferred": ["Docker", "AWS", ...],
      "highlighted_html": "<p>Build apps using <mark>React</mark>...</p>"
    }
    ```

### Task 3.4: Update Job Posting Creation Endpoint ✅
**File:** `skill-sync-backend/app/routes/internship.py`

Enhanced **POST `/api/internship/post`**:
- [x] Accept new fields: `preferred_years`, `rubric_weights`, `skill_weights`, `top_responsibilities`, `key_deliverable`, `requires_portfolio`, `role_level`
- [x] Accept `extracted_skills_raw` (AI-extracted before HR editing)
- [x] Accept `skills_extraction_confidence`
- [x] Validate rubric_weights sum to 1.0
- [x] Store both raw extracted skills and final HR-confirmed skills
- [x] Calculate content_hash for change detection

---

## Phase 4: Enhanced Explainability Backend ✅ COMPLETE
**Dependencies:** Phase 2 (Core Services), Phase 3 (Skill Extraction)
**Status:** ✅ Completed on November 6, 2025

### Task 4.1: Create Candidate Explanation API Endpoint ✅
**File:** `skill-sync-backend/app/routes/recommendations.py`

Add endpoint:
- [x] **GET `/api/candidates/{candidate_id}/explanation?internship_id={id}`**
  - [x] Fetch candidate and internship data
  - [x] Call `match_explanation_service.generate_explanation()`
  - [x] Return full explainability JSON with:
    - [x] Overall score, confidence, recommendation badge
    - [x] Component scores with formula
    - [x] Matched skills with proficiency, evidence snippets, confidence
    - [x] Missing skills with impact, reason, mitigation
    - [x] Experience timeline with relevant_years calculation
    - [x] Education match level
    - [x] Project highlights with evidence
    - [x] AI recommendation (strengths, concerns, interview questions)
    - [x] Provenance metadata
    - [x] Audit ID (if logged)
  
  **Example response:** (See candidate_card_wireframe_job_posting_template.md section 3)

### Task 4.2: Create Candidate Comparison API Endpoint ✅
**File:** `skill-sync-backend/app/routes/recommendations.py`

Add endpoint:
- [x] **GET `/api/internship/{internship_id}/compare?candidates={id1},{id2}`**
  - [x] Fetch explanations for both candidates
  - [x] Generate comparison structure:
    - [x] Side-by-side component scores
    - [x] Aligned skill lists (matched vs missing)
    - [x] Experience comparison (relevant years, project count)
    - [x] Natural language "Why A > B" summary
    - [x] Actionable next steps for each
  - [x] Log comparison action in audit log
  - [x] Return comparison JSON

### Task 4.3: Create AI Recommendation Generator ✅
**File:** `skill-sync-backend/app/services/match_explanation_service.py`

Enhance existing service:
- [x] `_generate_ai_recommendation(candidate_data, internship_data, component_scores)` → AI recommendation object
  - [x] Use Gemini API with detailed prompt and structured JSON schema
  - [x] Store full prompt and response for provenance
  - [x] Return structured recommendation with action, priority, strengths, concerns, interview questions
  - [x] Temperature: 0.3 for consistency
  - [x] Model: gemini-2.5-flash

- [x] Store LLM prompt and response in explanation object

### Task 4.4: Implement Precomputation Service ✅
**File:** `skill-sync-backend/app/services/precompute_service.py`

Create batch explanation generation:
- [x] `precompute_explanations_for_internship(internship_id)` → Generates explanations for all matched candidates
  - [x] Fetch top N candidates from `student_internship_matches`
  - [x] Generate full explanations for each
  - [x] Store in `CandidateExplanation` table
  - [x] Smart cache detection (24-hour TTL)
  - [x] Error resilience (continues on individual failures)
- [x] **POST `/api/internship/{id}/precompute`** (Company/Admin endpoint)
  - [x] Trigger precomputation for specific internship
  - [x] Return status and count of explanations generated
  - [x] Parameters: top_n (default 50, max 200), force_refresh
- [x] **GET `/api/internship/{id}/precompute-status`**
  - [x] Return cache coverage and freshness statistics
- [x] `invalidate_cache_for_internship(internship_id)` → Delete cached explanations
- [x] `invalidate_cache_for_candidate(candidate_id)` → Delete cached explanations
- [x] `get_precompute_status(internship_id)` → Return statistics

### Task 4.5: Update Intelligent Filtering to Use Explanations ✅
**File:** `skill-sync-backend/app/routes/intelligent_filtering.py`

Enhance existing endpoints:
- [x] Update **GET `/api/filter/rank-candidates/{id}/filtered`**
  - [x] Check if precomputed explanations exist
  - [x] If yes, return cached explanations with full data
  - [x] If no, mark as "not cached" with instruction message
  - [x] Include full explanation in response
  - [x] Log ranking action in audit log
  - [x] Return audit ID and cache statistics

---

## Phase 5: Frontend Components & UI ✅ COMPLETE
**Dependencies:** Phase 4 (Backend APIs)
**Status:** ✅ Completed on November 7, 2025

### Task 5.1: Create Job Posting Skill Extraction UI ✅
**File:** `skill-sync-frontend/src/components/company/SkillExtractionPanel.js`

Build Material-UI component:
- [x] Input: Large textarea for job description
- [x] "Extract Skills" button (calls `/api/internship/extract-skills`)
- [x] Loading state while extracting
- [x] Display highlighted description with color-coded skills:
  - High confidence (>0.8): Green background
  - Medium confidence (0.6-0.8): Yellow background
  - Low confidence (<0.6): Orange background
- [x] Extracted skills displayed as editable chips:
  - Chip color by confidence
  - Delete icon on each chip
  - Tooltip showing confidence score on hover
- [x] Two sections: "Must-Have Skills" and "Preferred Skills"
  - Click to move between sections
- [x] Manual "Add Skill" input field
- [x] Toggle functionality for each skill (Must-have / Preferred)
- [x] "Re-run Extraction" button
- [x] Props: `description`, `onSkillsExtracted(skills)`, `onChange(skills)`

### Task 5.2: Enhance Job Posting Form ✅
**File:** `skill-sync-frontend/src/pages/CreateInternship.js`

Add new fields:
- [x] Preferred years (separate from minimum years)
- [x] Top 3 responsibilities (bullet list input)
- [x] Key deliverable (text area)
- [x] Requires portfolio checkbox
- [x] Role level dropdown (Intern/Junior/Mid/Senior)
- [x] Integrate `SkillExtractionPanel` component
- [x] Rubric weight sliders (optional, collapsible section):
  - Skills weight (0-100%)
  - Experience weight (0-100%)
  - Semantic weight (0-100%)
  - Education weight (0-100%)
  - Projects weight (0-100%)
  - Show validation: must sum to 100%
- [x] Submit form with all new fields

### Task 5.3: Create Candidate Explanation Card Component ✅
**File:** `skill-sync-frontend/src/components/company/CandidateExplanationCard.js`

Build comprehensive Material-UI card:

**Header Section:**
- [x] Avatar, overall score, recommendation badge
- [x] Confidence icon (high/medium/low)
- [x] Audit ID (if present)
- [x] Support for anonymized mode

**WHY Pane (Default Visible):**
- [x] Component score horizontal stacked bar
  - Clickable segments with tooltip showing formula
  - Colors for each component (semantic, skills, experience, education, projects)
  - Percentage labels
- [x] Natural language summary from AI recommendation

**Skills Section:**
- [x] Matched skills as green chips
  - Format: "Skill • Proficiency"
  - Tooltip with confidence score
- [x] Missing skills as error alerts
  - Impact rating badge (High/Medium/Low)
  - Reason for missing
  - Recommended mitigation action

**Experience Timeline:**
- [x] Compact role display with skills tags
- [x] Show computed `relevant_years`

**Education & Certs:**
- [x] Degree, institution
- [x] GPA (if present)

**Projects Section:**
- [x] Top 2-3 project cards
- [x] Project title, description, technologies
- [x] Expandable sections

**AI Recommendation Block:**
- [x] Action badge (SHORTLIST/MAYBE/REJECT)
- [x] Priority indicator
- [x] Strengths (bullet points)
- [x] Concerns (bullet points)
- [x] Interview focus questions (expandable)
- [x] Collapsible "View Provenance" section

**Action Buttons:**
- [x] Shortlist button
- [x] Schedule interview button
- [x] Send assessment button
- [x] View full resume button
- [x] Download explanation PDF button

**Props:** `explanation` (full explanation object), `onAction(action, candidateId)`

### Task 5.4: Create Evidence Modal Component ✅
**File:** `skill-sync-frontend/src/components/company/EvidenceModal.js`

Build modal to show detailed evidence:
- [x] Skill/experience/project name header
- [x] List of evidence snippets
- [x] Each snippet shows:
  - Source (resume.pdf, section)
  - Highlighted text with context
  - Confidence score
  - Line numbers (if available)
- [x] Close button
- [x] Props: `open`, `onClose`, `evidenceList`, `title`

### Task 5.5: Create Side-by-Side Comparison Component ✅
**File:** `skill-sync-frontend/src/components/company/CandidateComparison.js`

Build comparison UI:
- [x] Two-column layout (Grid)
- [x] Comparison header: "Candidate A (score%) vs Candidate B (score%)"
- [x] Aligned rows with highlights:
  - Overall scores with visual bar comparison
  - Component scores (side-by-side bars)
  - Matched skills count (A: 5/7 vs B: 4/7)
  - Skill-by-skill comparison table
  - Highest-impact missing skills (red badges)
  - Experience comparison (relevant years, project count)
  - Education comparison
- [x] Natural language "Why A > B" summary at top (Material-UI Alert)
- [x] Actionable next steps for each candidate
- [x] Export comparison button
- [x] Props: `comparison` (comparison object from API)

### Task 5.6: Update Company Dashboard - Ranked Candidates View ✅
**File:** `skill-sync-frontend/src/pages/company/EnhancedCandidateRanking.js`

Enhance candidate list:
- [x] Replace simple list with `CandidateExplanationCard` components
- [x] Load explanations from `/api/candidates/{id}/explanation`
- [x] Add "Compare Selected" button (multi-select mode)
  - Checkboxes on each card
  - Compare up to 2 candidates at a time
  - Opens comparison modal/page
- [x] Add filters panel:
  - Min score slider
  - Recommendation filter (SHORTLIST/MAYBE/REJECT)
- [x] Add sort options:
  - By overall score
  - By skills match
  - By experience
  - By confidence
- [x] Pagination with lazy loading
- [x] Skeleton loaders while fetching explanations

### Task 5.7: Create Component Score Visualization ✅
**File:** `skill-sync-frontend/src/components/company/ComponentScoreBar.js`

Build interactive stacked bar:
- [x] Horizontal stacked bar chart (use Material-UI Box)
- [x] Segments for each component (semantic, skills, experience, education, projects)
- [x] Color-coded segments
- [x] Hover tooltip showing:
  - Component name
  - Percentage contribution
  - Raw score
  - Formula used
- [x] Click segment to expand details
- [x] Props: `componentScores`, `rubricWeights`

### Task 5.8: Create Skill Evidence Snippet Component ✅
**File:** `skill-sync-frontend/src/components/company/EvidenceSnippet.js`

Build snippet display:
- [x] Card with snippet text
- [x] Highlighted skill/keyword in text
- [x] Source badge (e.g., "Resume.pdf - Experience Section")
- [x] Confidence score badge
- [x] Line numbers (if available)
- [x] Expandable context button
- [x] Props: `snippet`, `source`, `confidence`, `highlighted_term`

---

## Phase 6: Audit & Fairness Features (Full Implementation)
**Dependencies:** Phase 4 (Explanation APIs), Phase 5 (Frontend Components)

### Task 6.1: Implement Fairness Check Service
**File:** `skill-sync-backend/app/services/fairness_service.py`

Create fairness analysis functions:
- [ ] `calculate_gini_coefficient(scores_by_group)` → Float (0-1)
  - Lower is more equal distribution
  - Group by demographics if available
- [ ] `calculate_disparate_impact(selection_rates_by_group)` → Float
  - Ratio of selection rates across protected groups
  - Flag if < 0.8 (80% rule)
- [ ] `calculate_statistical_parity(scores_by_group)` → Float
  - Difference in mean scores between groups
- [ ] `run_fairness_checks(internship_id, candidate_ids)` → FairnessReport
  - Run all applicable checks
  - Generate report with pass/fail for each metric
  - Store in `FairnessCheck` table
- [ ] `check_demographic_clustering(candidate_scores)` → Boolean
  - Detect if certain demographics cluster at top/bottom

**Note:** Only run if demographic data is available and with consent

### Task 6.2: Add Blind Mode Toggle
**File:** `skill-sync-backend/app/routes/recommendations.py`

Implement blind screening:
- [ ] Add `blind_mode` query parameter to ranking endpoints
- [ ] If `blind_mode=true`:
  - Strip PII before scoring (name, photo, university name, location)
  - Replace with anonymized identifiers (Candidate #1, #2, etc.)
  - Log blind mode usage in audit log
- [ ] Return anonymized data to frontend
- [ ] Add audit trail entry for blind mode usage

### Task 6.3: Create Fairness Dashboard (Admin)
**File:** `skill-sync-frontend/src/pages/admin/FairnessDashboard.js`

Build admin view:
- [ ] Select internship to analyze
- [ ] Display fairness metrics:
  - Gini coefficient chart
  - Disparate impact ratios
  - Statistical parity visualization
  - Pass/fail indicators
- [ ] Score distribution charts by demographic groups (if available)
- [ ] Audit log viewer:
  - Filter by date, action, user, internship
  - Export audit logs (CSV)
- [ ] Alert system for failed fairness checks
- [ ] Fairness report export (PDF)

### Task 6.4: Implement Audit Log Viewer
**File:** `skill-sync-frontend/src/components/admin/AuditLogViewer.js`

Build audit trail UI:
- [ ] Table view of audit logs
- [ ] Columns: Audit ID, timestamp, user, action, internship, candidates, filters, blind mode
- [ ] Filter options (date range, action type, user)
- [ ] Search by audit ID
- [ ] Click row to expand details:
  - Full filters applied
  - Result hash
  - IP address, user agent
  - Link to view original results (if still available)
- [ ] Export functionality (CSV, JSON)
- [ ] Pagination
- [ ] Props: `internshipId` (optional, to filter by internship)

### Task 6.5: Add Blind Mode Toggle to Frontend
**File:** `skill-sync-frontend/src/pages/company/InternshipDetails.js`

Add UI controls:
- [ ] Toggle switch: "Enable Blind Screening"
- [ ] Info tooltip explaining blind mode
- [ ] When enabled:
  - Add `blind_mode=true` to API calls
  - Display "🔒 Blind Mode Active" badge
  - Show anonymized candidate names
  - Hide photos, university names
- [ ] Store preference in local state
- [ ] Show audit ID for this session

---

## Phase 7: Advanced Features (Nice-to-Have)
**Dependencies:** All previous phases

### Task 7.1: PDF Export of Explanations
**File:** `skill-sync-backend/app/services/pdf_export_service.py`

Implement PDF generation:
- [ ] Install library: `reportlab` or `weasyprint`
- [ ] `generate_explanation_pdf(explanation_data)` → PDF file
  - Include: scores, snippets, audit ID, provenance
  - Format: professional layout with headers, sections
  - Include SkillSync branding
- [ ] **GET `/api/candidates/{id}/explanation/pdf?internship_id={id}`**
  - Generate PDF on-demand
  - Return PDF file download
  - Log download in audit trail

### Task 7.2: Skill Taxonomy Learning
**File:** `skill-sync-backend/app/services/skill_learning_service.py`

Auto-learn from history:
- [ ] `analyze_skill_patterns(company_id)` → Common skill combinations
  - Track which skills are frequently posted together
  - Build company-specific skill preferences
- [ ] `suggest_skills_for_new_job(company_id, job_title)` → Suggested skills
  - Based on similar past job postings
  - Based on industry standards
- [ ] Pre-populate skill suggestions when HR starts a new posting

### Task 7.3: Skill Weighting UI
**File:** `skill-sync-frontend/src/components/company/SkillWeightingPanel.js`

Build skill weight editor:
- [ ] List of all required/preferred skills
- [ ] Slider for each skill (0.0 - 2.0, default 1.0)
  - 2.0 = Critical (double importance)
  - 1.0 = Standard importance
  - 0.5 = Lower importance
- [ ] Visual preview of how weights affect matching
- [ ] Save weights to job posting
- [ ] Props: `skills`, `onChange(skillWeights)`

### Task 7.4: Comparison History & Analytics
**File:** `skill-sync-backend/app/services/comparison_analytics_service.py`

Track comparison patterns:
- [ ] Store all candidate comparisons
- [ ] `get_comparison_history(internship_id)` → List of comparisons
- [ ] `analyze_decision_patterns(company_id)` → Insights
  - Which factors influence decisions most
  - Common reasons for rejections
  - Average time to decision
- [ ] Admin analytics dashboard showing comparison patterns

### Task 7.5: Interview Question Generator
**File:** `skill-sync-backend/app/services/interview_question_service.py`

Generate role-specific questions:
- [ ] `generate_technical_questions(skills, proficiency_gaps)` → List of questions
  - Focus on missing or weak skills
  - Difficulty appropriate to role level
- [ ] `generate_behavioral_questions(experience_analysis)` → List of questions
  - Based on candidate's background
  - Project-specific probing questions
- [ ] Include in AI recommendation section
- [ ] Frontend: expandable "Suggested Interview Questions" panel

### Task 7.6: Candidate Export & Sharing
**File:** `skill-sync-frontend/src/components/company/ExportCandidates.js`

Build export functionality:
- [ ] Export selected candidates to CSV/Excel
  - Include: name, score, recommendation, key skills, contact
- [ ] Share candidate profiles via email
- [ ] Generate shareable link for specific candidate explanation
- [ ] Batch download resumes (ZIP file)

### Task 7.7: Real-time Skill Extraction (Advanced)
**File:** `skill-sync-frontend/src/components/company/SkillExtractionPanel.js`

Enhance to real-time:
- [ ] Debounced extraction as HR types (500ms delay)
- [ ] Show loading indicator in textarea
- [ ] Highlight skills in real-time as they're detected
- [ ] Streaming results (update chips as skills are extracted)
- [ ] WebSocket connection for long descriptions

### Task 7.8: Mobile-Responsive Candidate Cards
**File:** `skill-sync-frontend/src/components/company/CandidateExplanationCard.js`

Optimize for mobile:
- [ ] Collapsible sections by default on small screens
- [ ] Horizontal scroll for component score bar
- [ ] Bottom sheet for evidence modal (instead of center modal)
- [ ] Touch-friendly action buttons
- [ ] Responsive typography
- [ ] Test on tablet and phone screens

---

## 🎯 Implementation Priority Summary

### **CRITICAL PATH (Must Do First):**
1. Phase 1: Database migrations and models
2. Phase 2: Core backend services (provenance, scoring, explanation)
3. Phase 3: Job posting skill extraction
4. Phase 4: Enhanced explainability APIs
5. Phase 5: Frontend components (Tasks 5.1-5.6 core UI)

### **HIGH PRIORITY (Do Next):**
6. Phase 5: Tasks 5.7-5.8 (visualizations)
7. Phase 6: Tasks 6.1-6.2 (fairness checks, blind mode backend)
8. Phase 6: Tasks 6.4-6.5 (audit log viewer, blind mode UI)

### **MEDIUM PRIORITY (After Core Features):**
9. Phase 6: Task 6.3 (fairness dashboard)
10. Phase 7: Tasks 7.1, 7.2, 7.5 (PDF export, skill learning, interview questions)

### **LOW PRIORITY (Polish & Advanced):**
11. Phase 7: Tasks 7.3-7.4, 7.6-7.8 (weighting UI, analytics, export, real-time, mobile)

---

## 📊 Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 3 tasks | 6-8 hours |
| Phase 2 | 5 tasks | 12-16 hours |
| Phase 3 | 4 tasks | 8-10 hours |
| Phase 4 | 5 tasks | 10-12 hours |
| Phase 5 | 8 tasks | 16-20 hours |
| Phase 6 | 5 tasks | 10-14 hours |
| Phase 7 | 8 tasks | 16-20 hours |
| **Total** | **38 tasks** | **78-100 hours** |

---

## 🔄 Dependency Graph (Simplified)

```
Phase 1 (Database)
    ↓
Phase 2 (Core Services)
    ↓
    ├─→ Phase 3 (Skill Extraction)
    │       ↓
    └─→ Phase 4 (Explainability APIs)
            ↓
        Phase 5 (Frontend UI)
            ↓
        Phase 6 (Audit & Fairness)
            ↓
        Phase 7 (Advanced Features)
```

---

## ✅ Testing Checklist (Per Phase)

### Phase 1-2 Testing:
- [x] Database migrations run successfully
- [x] New models create tables correctly
- [x] Component score calculations accurate
- [x] Provenance extraction works for sample resumes
- [x] Explanation generation completes without errors

### Phase 3 Testing:
- [x] Skill extraction identifies 10+ skills from sample JD
- [x] Highlighting shows correct text spans
- [x] Confidence scores reasonable (0.7-1.0 for obvious skills)
- [x] API endpoint returns valid JSON

### Phase 4 Testing:
- [x] Explanation API returns complete data structure
- [x] Comparison API highlights correct differences
- [x] AI recommendations generate valid text
- [x] Precomputation completes for 50+ candidates

### Phase 5 Testing:
- [ ] Skill extraction UI highlights skills correctly
- [ ] Color coding matches confidence levels
- [ ] Candidate cards render all sections
- [ ] Evidence modals display snippets
- [ ] Comparison view shows side-by-side correctly
- [ ] All buttons trigger correct actions

### Phase 6 Testing:
- [ ] Fairness metrics calculate correctly
- [ ] Blind mode removes PII completely
- [ ] Audit logs capture all actions
- [ ] Audit log viewer displays correctly

### Phase 7 Testing:
- [ ] PDF export generates valid PDF files
- [ ] Skill learning suggests relevant skills
- [ ] Interview questions are relevant
- [ ] Export functionality works for CSV/Excel

---

## 📝 Notes & Considerations

1. **Gemini API Rate Limits:** Monitor usage for skill extraction and AI recommendations. Consider caching results.

2. **Database Performance:** Add indexes on `candidate_id`, `internship_id` in `CandidateExplanation` table for fast queries.

3. **Frontend State Management:** Consider Redux/Context for managing explanation data across components.

4. **Error Handling:** All API endpoints need proper error handling and user-friendly messages.

5. **Caching Strategy:** Cache explanations for 24 hours. Invalidate when resume or job posting updates.

6. **Privacy Compliance:** Ensure demographic data handling complies with GDPR/privacy laws. Get explicit consent.

7. **Mobile First:** Design candidate cards to be responsive from the start.

8. **Accessibility:** Use ARIA labels, keyboard navigation, and screen reader support for all components.

9. **Testing:** Write unit tests for all scoring functions. Integration tests for API endpoints.

10. **Documentation:** Update API documentation with new endpoints and response formats.

---

## 🚀 Quick Start Guide

To begin implementation:

1. **Start with Phase 1, Task 1.1:** Create database migration script
2. **Run migration:** Apply changes to database
3. **Verify:** Check that new columns exist in `internships` table
4. **Move to Task 1.2:** Create explainability models
5. **Continue sequentially** through each phase

**Do not skip dependencies!** Each task builds on previous tasks.

---

## 📞 Questions or Blockers?

If you encounter any issues or need clarification on any task:
- Review the source documents (chatgpt-feedback.md, candidate_card_wireframe_job_posting_template.md, job-posting-extraction.md)
- Check existing code in `app/routes/intelligent_filtering.py` for patterns
- Ask for clarification before proceeding with unclear tasks

---

**Document Status:** ✅ Complete and Ready for Implementation  
**Last Updated:** November 6, 2025  
**Version:** 1.0
