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

## Phase 1: Database & Model Changes
**Dependencies:** None  
**Why First:** All other features depend on the data model

### Task 1.1: Create Database Migration for Internship Model Enhancements
**File:** `skill-sync-backend/scripts/migrate_job_posting_enhancements.py`

**Add to `Internship` model:**
- [ ] `preferred_years` (Float) - Preferred years of experience (separate from min)
- [ ] `rubric_weights` (JSON) - Custom weights per job: `{semantic: 0.35, skills: 0.30, experience: 0.20, education: 0.10, projects: 0.05}`
- [ ] `skill_weights` (JSON) - Individual skill importance: `[{skill: "React", weight: 1.0, type: "must"}, ...]`
- [ ] `top_responsibilities` (JSON) - List of 3 key responsibilities
- [ ] `key_deliverable` (Text) - First 3-month deliverable description
- [ ] `requires_portfolio` (Boolean) - Whether portfolio/GitHub is required
- [ ] `role_level` (String) - Intern/Junior/Mid/Senior
- [ ] `extracted_skills_raw` (JSON) - Raw AI-extracted skills before HR editing
- [ ] `skills_extraction_confidence` (JSON) - Confidence scores for each extracted skill

**Migration Script:**
```python
# Add columns to internships table
# Backfill existing records with defaults
# Create indexes for new JSON columns
```

### Task 1.2: Create Explainability Models
**File:** `skill-sync-backend/app/models/explainability.py`

Create new models:
- [ ] **`CandidateExplanation` table:**
  - `id`, `candidate_id`, `internship_id`, `overall_score`, `confidence`
  - `recommendation` (SHORTLIST/MAYBE/REJECT)
  - `component_scores` (JSON) - semantic, skills, experience, education, projects
  - `matched_skills` (JSON) - with proficiency, evidence, confidence
  - `missing_skills` (JSON) - with impact, reason, recommendation
  - `experience_analysis` (JSON) - total_years, relevant_years, breakdown
  - `education_analysis` (JSON)
  - `project_analysis` (JSON)
  - `ai_recommendation` (JSON) - action, priority, justification, prompt, response
  - `provenance` (JSON) - extraction_model, extract_time, data_sources
  - `created_at`, `updated_at`

- [ ] **`AuditLog` table:**
  - `id`, `audit_id` (unique, e.g., AUD-2025-11-06-001)
  - `user_id`, `action` (rank/explain/shortlist/compare)
  - `internship_id`, `candidate_ids` (JSON array)
  - `filters_applied` (JSON), `blind_mode` (Boolean)
  - `result_hash` (String) - hash of results for verification
  - `timestamp`, `ip_address`, `user_agent`

- [ ] **`FairnessCheck` table:**
  - `id`, `audit_id` (FK to AuditLog)
  - `internship_id`, `check_type` (gini/disparate_impact/statistical_parity)
  - `metric_value` (Float), `pass_threshold` (Float)
  - `passed` (Boolean), `notes` (Text)
  - `created_at`

### Task 1.3: Add Provenance Fields to Resume Model
**File:** `skill-sync-backend/app/models/resume.py`

Add fields:
- [ ] `extraction_confidence` (JSON) - confidence per section (skills, experience, education)
- [ ] `skill_evidences` (JSON) - snippets that prove each skill with line numbers
- [ ] `experience_evidences` (JSON) - raw text snippets for each job
- [ ] `project_evidences` (JSON) - raw text snippets for each project
- [ ] `extraction_metadata` (JSON) - model used, timestamp, version

---

## Phase 2: Backend Core Services
**Dependencies:** Phase 1 (Database Models)

### Task 2.1: Implement Provenance Extraction Service
**File:** `skill-sync-backend/app/services/provenance_service.py`

Create functions:
- [ ] `extract_skill_provenance(resume_text, skills)` → Returns snippets with line numbers
- [ ] `extract_experience_provenance(resume_text, experiences)` → Returns date ranges + snippets
- [ ] `extract_project_provenance(resume_text, projects)` → Returns project descriptions + tech stacks
- [ ] `calculate_extraction_confidence(evidences)` → Returns confidence score 0-1
- [ ] `store_provenance(resume_id, provenances)` → Saves to database

**Use:** Gemini API to identify exact text spans that support each extracted claim

### Task 2.2: Implement Component Score Calculator Service
**File:** `skill-sync-backend/app/services/component_score_service.py`

Create functions:
- [ ] `calculate_semantic_score(resume_embedding, job_embedding)` → 0-100
- [ ] `calculate_skills_score(candidate_skills, required_skills, preferred_skills, skill_weights)` → 0-100
  - Handle exact match, fuzzy match, proficiency weighting
  - Return matched_skills list and missing_skills list with impact ratings
- [ ] `calculate_experience_score(candidate_exp, min_years, preferred_years)` → 0-100
  - Calculate relevant_years from roles mentioning required skills
- [ ] `calculate_education_score(candidate_edu, required_edu)` → 0-100
- [ ] `calculate_projects_score(candidate_projects, required_skills)` → 0-100
- [ ] `calculate_final_score(component_scores, rubric_weights)` → 0-100
- [ ] `generate_confidence_score(component_confidences)` → 0-1

### Task 2.3: Enhance Match Explanation Service
**File:** `skill-sync-backend/app/services/match_explanation_service.py`

Implement full explainability:
- [ ] `generate_explanation(candidate_id, internship_id)` → CandidateExplanation object
  - Fetch resume with provenance
  - Fetch internship with requirements
  - Calculate all component scores with evidence
  - Generate AI recommendation paragraph using Gemini
  - Store provenance (model, timestamp, data sources)
  - Return structured explanation JSON
  
- [ ] `generate_comparison_explanation(candidate_id_1, candidate_id_2, internship_id)` → Comparison object
  - Side-by-side component scores
  - Highlight decisive differences
  - Generate natural language summary ("Why A > B")
  - Actionable next steps for each candidate

- [ ] `generate_short_reason(explanation)` → One-sentence summary for card header

### Task 2.4: Implement Skill Proficiency Analyzer
**File:** `skill-sync-backend/app/services/skill_proficiency_service.py`

Create functions:
- [ ] `calculate_proficiency(skill, resume_data)` → Expert/Advanced/Intermediate/Beginner
  - Years of experience with skill (from roles/projects): 0-10 years
  - Number of projects using skill: 0-N
  - Certifications: Boolean
  - Formula: `proficiency = 0.5*norm(years) + 0.3*norm(projects) + 0.2*cert_flag`
- [ ] `map_proficiency_score(proficiency_value)` → String label
- [ ] `get_skill_evidence(skill, resume_text, resume_data)` → List of evidence objects

### Task 2.5: Create Audit Log Service
**File:** `skill-sync-backend/app/services/audit_service.py`

Implement:
- [ ] `create_audit_log(user_id, action, internship_id, candidate_ids, filters, blind_mode)` → audit_id
- [ ] `generate_audit_id()` → "AUD-YYYY-MM-DD-XXXX" format
- [ ] `calculate_result_hash(results)` → SHA-256 hash
- [ ] `get_audit_trail(internship_id)` → List of audit logs
- [ ] `verify_audit_integrity(audit_id)` → Boolean (check hash)

---

## Phase 3: Job Posting Skill Extraction
**Dependencies:** Phase 2 (Component Score Service for skill taxonomy)

### Task 3.1: Create Skill Taxonomy Service
**File:** `skill-sync-backend/app/services/skill_taxonomy_service.py`

Build skill vocabulary:
- [ ] Load comprehensive skill list (tech + soft skills)
- [ ] Create skill categorization: `{skill: {category: "Frontend/Backend/Database/Soft", aliases: [...]}}`
- [ ] `find_skill_matches(text)` → Fuzzy match skills in text
- [ ] `categorize_skill(skill_name)` → Category
- [ ] `get_skill_aliases(skill_name)` → List of alternatives

**Data source:** Create `data/skill_taxonomy.json` with 200+ common skills

### Task 3.2: Implement AI Skill Extraction Service
**File:** `skill-sync-backend/app/services/skill_extraction_service.py`

Create functions:
- [ ] `extract_skills_from_description(title, description, num_suggestions=15)` → List of skills with confidence
  - Use Gemini API with specific prompt:
    ```
    Extract up to 15 relevant hard and soft skills from this job description.
    Return JSON: [{"skill": name, "category": "tech"|"soft", "confidence": 0-1, "span": [start, end]}]
    
    Job Title: {title}
    Description: {description}
    ```
  - Return skills sorted by confidence
  - Include text span positions for highlighting

- [ ] `highlight_skills_in_text(description, extracted_skills)` → HTML with highlighted spans
  - Generate HTML with `<mark class="skill-highlight-{confidence}">skill</mark>>`
  - Different colors for confidence levels: High (green), Medium (yellow), Low (orange)

- [ ] `categorize_extracted_skills(skills, required_threshold=0.8)` → {must_have: [], preferred: []}
  - Auto-suggest must_have for confidence > 0.8
  - Auto-suggest preferred for 0.6 < confidence <= 0.8

### Task 3.3: Create Job Posting Skill Extraction API Endpoint
**File:** `skill-sync-backend/app/routes/internship.py`

Add endpoint:
- [ ] **POST `/api/internship/extract-skills`**
  - Input: `{title, description, num_suggestions}`
  - Process: Call skill extraction service
  - Output: 
    ```json
    {
      "skills": [
        {"skill": "React", "confidence": 0.97, "category": "tech", "span": [45, 50]},
        ...
      ],
      "suggested_must_have": ["React", "Node.js", ...],
      "suggested_preferred": ["Docker", "AWS", ...],
      "highlighted_html": "<p>Build apps using <mark>React</mark>...</p>"
    }
    ```

### Task 3.4: Update Job Posting Creation Endpoint
**File:** `skill-sync-backend/app/routes/internship.py`

Enhance **POST `/api/internship/post`**:
- [ ] Accept new fields: `preferred_years`, `rubric_weights`, `skill_weights`, `top_responsibilities`, `key_deliverable`, `requires_portfolio`, `role_level`
- [ ] Accept `extracted_skills_raw` (AI-extracted before HR editing)
- [ ] Accept `skills_extraction_confidence`
- [ ] Validate rubric_weights sum to 1.0
- [ ] Store both raw extracted skills and final HR-confirmed skills
- [ ] Calculate content_hash for change detection

---

## Phase 4: Enhanced Explainability Backend
**Dependencies:** Phase 2 (Core Services), Phase 3 (Skill Extraction)

### Task 4.1: Create Candidate Explanation API Endpoint
**File:** `skill-sync-backend/app/routes/recommendations.py`

Add endpoint:
- [ ] **GET `/api/candidates/{candidate_id}/explanation?internship_id={id}`**
  - Fetch candidate and internship data
  - Call `match_explanation_service.generate_explanation()`
  - Return full explainability JSON with:
    - Overall score, confidence, recommendation badge
    - Component scores with formula
    - Matched skills with proficiency, evidence snippets, confidence
    - Missing skills with impact, reason, mitigation
    - Experience timeline with relevant_years calculation
    - Education match level
    - Project highlights with evidence
    - AI recommendation (strengths, concerns, interview questions)
    - Provenance metadata
    - Audit ID (if logged)
  
  **Example response:** (See candidate_card_wireframe_job_posting_template.md section 3)

### Task 4.2: Create Candidate Comparison API Endpoint
**File:** `skill-sync-backend/app/routes/recommendations.py`

Add endpoint:
- [ ] **GET `/api/internship/{internship_id}/compare?candidates={id1},{id2}`**
  - Fetch explanations for both candidates
  - Generate comparison structure:
    - Side-by-side component scores
    - Aligned skill lists (matched vs missing)
    - Experience comparison (relevant years, project count)
    - Natural language "Why A > B" summary
    - Actionable next steps for each
  - Log comparison action in audit log
  - Return comparison JSON

### Task 4.3: Create AI Recommendation Generator
**File:** `skill-sync-backend/app/services/ai_recommendation_service.py`

Enhance existing service:
- [ ] `generate_detailed_recommendation(candidate_data, internship_data, component_scores)` → AI recommendation object
  - Use Gemini API with detailed prompt:
    ```
    Analyze this candidate for the internship role.
    
    Candidate: {name}, {experience}, {skills}, {projects}
    Role: {title}, {requirements}, {responsibilities}
    Scores: {component_scores}
    
    Provide:
    1. Action: SHORTLIST | MAYBE | REJECT
    2. Priority: High | Medium | Low
    3. Top 3 Strengths (bullet points)
    4. Top 2 Concerns (bullet points)
    5. 3 Interview Focus Questions
    6. Overall Justification (2-3 sentences)
    ```
  - Store full prompt and response for provenance
  - Return structured recommendation

- [ ] Store LLM prompt and response in explanation object

### Task 4.4: Implement Precomputation Service
**File:** `skill-sync-backend/app/services/precompute_service.py`

Create batch explanation generation:
- [ ] `precompute_explanations_for_internship(internship_id)` → Generates explanations for all matched candidates
  - Fetch top N candidates from `student_internship_matches`
  - Generate full explanations for each
  - Store in `CandidateExplanation` table
  - Update cache invalidation logic
- [ ] **POST `/api/internship/{id}/precompute`** (Admin endpoint)
  - Trigger precomputation for specific internship
  - Return status and count of explanations generated

### Task 4.5: Update Intelligent Filtering to Use Explanations
**File:** `skill-sync-backend/app/routes/intelligent_filtering.py`

Enhance existing endpoints:
- [ ] Update **GET `/api/internship/{id}/ranked-candidates`**
  - Check if precomputed explanations exist
  - If yes, return cached explanations
  - If no, generate on-the-fly
  - Include full explanation in response
  - Log ranking action in audit log

---

## Phase 5: Frontend Components & UI
**Dependencies:** Phase 4 (Backend APIs)

### Task 5.1: Create Job Posting Skill Extraction UI
**File:** `skill-sync-frontend/src/components/company/SkillExtractionPanel.js`

Build Material-UI component:
- [ ] Input: Large textarea for job description
- [ ] "Extract Skills" button (calls `/api/internship/extract-skills`)
- [ ] Loading state while extracting
- [ ] Display highlighted description with color-coded skills:
  - High confidence (>0.8): Green background
  - Medium confidence (0.6-0.8): Yellow background
  - Low confidence (<0.6): Orange background
- [ ] Extracted skills displayed as editable chips:
  - Chip color by confidence
  - Delete icon on each chip
  - Tooltip showing confidence score on hover
- [ ] Two sections: "Must-Have Skills" and "Preferred Skills"
  - Drag-and-drop or click to move between sections
- [ ] Manual "Add Skill" input field
- [ ] Toggle switches for each skill (Must-have / Preferred)
- [ ] "Re-run Extraction" button
- [ ] Props: `description`, `onSkillsExtracted(skills)`, `onChange(skills)`

### Task 5.2: Enhance Job Posting Form
**File:** `skill-sync-frontend/src/pages/company/CreateInternship.js`

Add new fields:
- [ ] Preferred years (separate from minimum years)
- [ ] Top 3 responsibilities (bullet list input)
- [ ] Key deliverable (text area)
- [ ] Requires portfolio checkbox
- [ ] Role level dropdown (Intern/Junior/Mid/Senior)
- [ ] Integrate `SkillExtractionPanel` component
- [ ] Rubric weight sliders (optional, collapsible section):
  - Skills weight (0-100%)
  - Experience weight (0-100%)
  - Semantic weight (0-100%)
  - Education weight (0-100%)
  - Projects weight (0-100%)
  - Show validation: must sum to 100%
- [ ] Submit form with all new fields

### Task 5.3: Create Candidate Explanation Card Component
**File:** `skill-sync-frontend/src/components/company/CandidateExplanationCard.js`

Build comprehensive Material-UI card (see wireframe in candidate_card_wireframe_job_posting_template.md):

**Header Section:**
- [ ] Avatar, name, overall score, recommendation badge
- [ ] Confidence icon (high/medium/low)
- [ ] Short reason phrase
- [ ] Audit ID (if present)
- [ ] Anonymized flag (if blind mode)

**WHY Pane (Default Visible):**
- [ ] Component score horizontal stacked bar
  - Clickable segments with tooltip showing formula
  - Colors for each component (semantic, skills, experience, education, projects)
  - Percentage labels
- [ ] Natural language summary sentence

**Skills Section:**
- [ ] Matched skills as green chips
  - Format: "Skill • Proficiency • Confidence"
  - Click expands to show evidence snippets
  - Evidence modal with:
    - Resume snippets (highlighted)
    - Project references
    - Extraction confidence
- [ ] Missing skills as red/orange chips
  - Impact rating badge (High/Medium/Low)
  - Reason for missing
  - Recommended mitigation action

**Experience Timeline:**
- [ ] Compact timeline visualization (Material-UI Timeline)
- [ ] Role cards: title, company, duration, skills tags
- [ ] Highlight relevant roles (used required skills)
- [ ] Show computed `relevant_years`

**Education & Certs:**
- [ ] Degree, institution, match level
- [ ] GPA (if present)
- [ ] Certification badges

**Projects Section:**
- [ ] Top 2-3 project cards
- [ ] Project title, role, duration, technologies
- [ ] Link to portfolio/GitHub (if available)
- [ ] Expandable excerpt from resume

**AI Recommendation Block:**
- [ ] Action badge (SHORTLIST/MAYBE/REJECT)
- [ ] Priority indicator
- [ ] Strengths (3 bullet points)
- [ ] Concerns (2 bullet points)
- [ ] Interview focus questions (3 questions, expandable)
- [ ] Collapsible "View Provenance" section:
  - LLM prompt used
  - LLM response
  - Model name, timestamp

**Bias & Audit (If Applicable):**
- [ ] "Fair Screening Active" chip
- [ ] Audit ID display
- [ ] Fairness score metric

**Action Buttons:**
- [ ] Shortlist button
- [ ] Schedule interview button
- [ ] Send assessment button
- [ ] View full resume button
- [ ] Download explanation PDF button (nice-to-have)

**Props:** `explanation` (full explanation object), `onAction(action, candidateId)`

### Task 5.4: Create Evidence Modal Component
**File:** `skill-sync-frontend/src/components/company/EvidenceModal.js`

Build modal to show detailed evidence:
- [ ] Skill/experience/project name header
- [ ] List of evidence snippets
- [ ] Each snippet shows:
  - Source (resume.pdf, section)
  - Highlighted text with context
  - Confidence score
  - Line numbers (if available)
- [ ] Close button
- [ ] Props: `open`, `onClose`, `evidenceList`, `title`

### Task 5.5: Create Side-by-Side Comparison Component
**File:** `skill-sync-frontend/src/components/company/CandidateComparison.js`

Build comparison UI:
- [ ] Two-column layout (Grid)
- [ ] Comparison header: "Candidate A (score%) vs Candidate B (score%)"
- [ ] Aligned rows with highlights:
  - Overall scores with visual bar comparison
  - Component scores (side-by-side bars)
  - Matched skills count (A: 5/7 vs B: 4/7)
  - Skill-by-skill comparison table
  - Highest-impact missing skills (red badges)
  - Experience comparison (relevant years, project count)
  - Education comparison
- [ ] Natural language "Why A > B" summary at top (Material-UI Alert)
- [ ] Actionable next steps for each candidate
- [ ] Export comparison button
- [ ] Props: `comparison` (comparison object from API)

### Task 5.6: Update Company Dashboard - Ranked Candidates View
**File:** `skill-sync-frontend/src/pages/company/InternshipDetails.js`

Enhance candidate list:
- [ ] Replace simple list with `CandidateExplanationCard` components
- [ ] Load explanations from `/api/candidates/{id}/explanation`
- [ ] Add "Compare Selected" button (multi-select mode)
  - Checkboxes on each card
  - Compare up to 2 candidates at a time
  - Opens comparison modal/page
- [ ] Add filters panel:
  - Min score slider
  - Recommendation filter (SHORTLIST/MAYBE/REJECT)
  - Skill filters (must have specific skill)
  - Experience range
- [ ] Add sort options:
  - By overall score
  - By skills match
  - By experience
  - By confidence
- [ ] Pagination with lazy loading
- [ ] Skeleton loaders while fetching explanations

### Task 5.7: Create Component Score Visualization
**File:** `skill-sync-frontend/src/components/company/ComponentScoreBar.js`

Build interactive stacked bar:
- [ ] Horizontal stacked bar chart (use Material-UI Box or custom Canvas)
- [ ] Segments for each component (semantic, skills, experience, education, projects)
- [ ] Color-coded segments
- [ ] Hover tooltip showing:
  - Component name
  - Percentage contribution
  - Raw score
  - Formula used
- [ ] Click segment to expand details
- [ ] Props: `componentScores`, `rubricWeights`

### Task 5.8: Create Skill Evidence Snippet Component
**File:** `skill-sync-frontend/src/components/company/EvidenceSnippet.js`

Build snippet display:
- [ ] Card with snippet text
- [ ] Highlighted skill/keyword in text
- [ ] Source badge (e.g., "Resume.pdf - Experience Section")
- [ ] Confidence score badge
- [ ] Line numbers (if available)
- [ ] Expandable context button
- [ ] Props: `snippet`, `source`, `confidence`, `highlighted_term`

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
- [ ] Database migrations run successfully
- [ ] New models create tables correctly
- [ ] Component score calculations accurate
- [ ] Provenance extraction works for sample resumes
- [ ] Explanation generation completes without errors

### Phase 3 Testing:
- [ ] Skill extraction identifies 10+ skills from sample JD
- [ ] Highlighting shows correct text spans
- [ ] Confidence scores reasonable (0.7-1.0 for obvious skills)
- [ ] API endpoint returns valid JSON

### Phase 4 Testing:
- [ ] Explanation API returns complete data structure
- [ ] Comparison API highlights correct differences
- [ ] AI recommendations generate valid text
- [ ] Precomputation completes for 50+ candidates

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
