# Candidate Card Wireframe & Job Posting Template

---

# 1. Wireframe — Candidate Card (HR view)

```
+────────────────────────────────────────────────────────────────────────────+
|  • CandidateCard                                                           |
| +--------------------------------------------------------------------------+
| | [Avatar]  Aanya Gupta                     80%  •  SHORTLIST  •  High Conf |
| | ID: 15   | Location: Bangalore | 4 yrs relevant | Audit: AUD-2025-11-06-001 |
| +--------------------------------------------------------------------------+
| | WHY: Strong skills match (5/7) · Exceeds experience requirement by 1 year |
| +--------------------------------------------------------------------------+
| | • Component bar: [semantic 35% | skills 30% | experience 20% | edu 10%|proj 5%]
| |   (hover segments to see numeric contribution and formula)               |
| +--------------------------------------------------------------------------+
| | 🎯 Matched Skills (5)        | ❌ Missing (2)                         |
| | [React - Intermediate • 0.92] | REST API — High impact — No explicit  |
| | [TypeScript - Expert • 0.95]  | evidence. Recommend mini-assignment. |
| | [Node.js - Advanced • 0.86]   | JavaScript — low impact (has TS)     |
| +--------------------------------------------------------------------------+
| | 💼 Experience (3 yrs relevant)   • Roles timeline (compact)             |
| |  • Backend Intern @ XYZ (2021-01 → 2021-07) [Node.js, Postgres]          |
| |  • Full Stack @ ABC (2022-03 → Present) [React, TS, REST]               |
| +--------------------------------------------------------------------------+
| | 🎓 Education: BS Computer Science — Strong match (GPA: 3.8 if present)  |
| +--------------------------------------------------------------------------+
| | 🧾 Project highlights:                                                      |
| |  • E-commerce Platform — Team Lead — Built REST APIs, migrations, CI/CD   |
| |  • Chat App — Realtime websockets + PostgreSQL                           |
| +--------------------------------------------------------------------------+
| | 🤖 AI Recommendation: SHORTLIST (High)                                    |
| |  Strengths: project leadership, TypeScript/React expertise                |
| |  Concerns: REST API evidence ambiguous — ask for API design sample        |
| +--------------------------------------------------------------------------+
| | Actions: [Shortlist] [Schedule interview] [Send mini-assignment] [View CV]|
+────────────────────────────────────────────────────────────────────────────+
```

---

# 2. Candidate Card — Component Spec

## Header (one-line)
- Fields: `name`, `match_score`, `recommendation_badge`, `confidence_icon`, `audit_id` (if present), `anonymized_flag` (if blind mode)
- UX: clicking name opens full-resume; badge color: green/yellow/red

## WHY pane (default visible)
- Component score stacked bar (interactive tooltip)
- Short natural-language summary (1 sentence): generated from structured explainability JSON

## Skills area
- Chips for matched skills: label = `name • proficiency • confidence` (e.g., `React • Intermediate • 0.92`)
- Click/chips open detail panel with evidence snippets and project references
- Missing skills shown with `impact` and `recommended action`

## Experience timeline
- Compact timeline: role name, company, from→to, tags (skills used)
- Show computed `relevant_years`

## Education & Certs
- Degree, institution, match_level, cert badges

## Projects
- Top 2–3 projects (title, role, techs, impact lines). Click to expand to snippet.

## AI Recommendation block
- `action`, `priority`, `strengths`, `concerns`, `interview_focus` (3 suggested questions)
- Show LLM prompt & response provenance (collapsed by default)

## Bias & Audit
- If blind mode or checks ran: small chip `Fair Screening Active` and `Audit ID`
- Fairness quick metric (if computed): e.g., `Fairness Score: 0.92`

## Actions
- Buttons: Shortlist, Invite for Assessment, Schedule Interview, Download Explanation (PDF), View Full Resume

---

# 3. Data model & API (minimal fields needed)

### Explainability JSON (example fields)

```json
{
  "candidate_id": 58,
  "internship_id": 15,
  "overall_score": 78.0,
  "confidence": 0.87,
  "recommendation": "SHORTLIST",
  "component_scores": {"semantic":75.8,"skills":80.0,"experience":100.0,"education":85.0,"projects":60.0},
  "skills": [{"name":"React","matched":true,"proficiency":"Intermediate","evidence":[{"snippet":"Built UI with React & Redux","source":"resume.pdf","confidence":0.98}],"confidence":0.95}],
  "missing_skills":[{"name":"REST API","impact":"High","reason":"No explicit mention","recommendation":"Send mini-assignment"}],
  "experience_analysis":{"total_years":3,"relevant_years":3,"breakdown":[...]},
  "education":{...},
  "ai_recommendation":{"action":"SHORTLIST","priority":"High","justification":"...","prompt":"..."},
  "bias_check":{"audit_id":"AUD-2025-11-06-001","fairness_score":0.92}
}
```

### Endpoints
- `GET /api/candidates/{candidate_id}/explanation?internship_id=xxx`
- `GET /api/internship/{id}/compare?candidates=58,15`
- `POST /api/internship/{id}/compute-precompute` (admin trigger)
- Audit log creation on every `rank`/`explain` call

---

# 4. Job Posting Template (what to ask HR to fill)

> **Goal:** make job posting structured so matching is explainable and auditable.

## Required fields (must have)
- Job title (string)
- Company (string)
- Location (onsite/remote/hybrid + city)
- Duration (if intern) or type (FT/Contract)
- Stipend / salary range
- **Minimum experience:** `min_years` (number) and `preferred_years` (optional)
- **Must-have skills:** list (HR marks `must`)
- **Preferred skills:** list (HR marks `preferred`)
- **Top 3 responsibilities:** bullet list (free text)
- **Key deliverable in first 3 months:** (1–2 bullets)
- **Portfolio/GitHub required?** (checkbox)
- **Weights/rubric (optional):** sliders for `skills / experience / education / projects`

## Optional fields
- Nice-to-have qualifications
- Education requirement (degree or field)
- Sample assessment (link to coding task)
- Hiring manager notes (private)

---

# 5. Sample Job Posting — Full Stack Software Engineer Intern

**Title:** Full Stack Software Engineer Intern

**Company:** TechCorp Solutions

**Location:** Bangalore, India (Hybrid)

**Duration:** 6 months

**Compensation:** ₹40,000 / month

**Minimum Experience:** 2 years (required), 3+ years preferred

**Must-have skills:**
- React (must)
- Node.js (must)
- JavaScript (must)
- TypeScript (preferred)
- PostgreSQL (must)
- REST API (must)
- Git (must)

**Preferred skills:**
- Docker
- CI/CD (GitHub Actions)
- AWS (EC2, RDS)

**Top 3 responsibilities:**
1. Build and maintain user-facing features using React and TypeScript.
2. Design and implement RESTful APIs using Node.js and PostgreSQL.
3. Contribute to CI/CD pipelines and deployment automation.

**Key deliverable (first 3 months):**
- Ship a production-ready module that allows users to create and manage resources via REST API and React UI with tests and deployment pipeline.

**Rubric weights (default):** skills 35% / experience 30% / semantic 20% / education 10% / projects 5%

**Assessment:** Short coding task (1.5 hours) — optional, can be auto-sent to shortlisted candidates

---

# 6. Tailored vs Base Resume — UX & Policy suggestions

## UX flows
1. **Base resume (default):** when a user signs up and uploads their base resume, the system extracts structured data and the candidate becomes discoverable across all job postings (precomputed matches appear to HR).
2. **Tailored resume (optional per application):** Candidate can upload a tailored resume when applying. On application, compute a real-time tailored score and combine with base precomputed score (configurable mix, e.g., 70% tailored + 30% base).

## UI affordances
- Show `Active resume: Base` or `Active resume: Tailored for Job X` on candidate profile
- When HR views candidate list, indicate whether score is derived from base or tailored resume (icon + tooltip)
- Allow candidates to submit tailored resume before applying (encourage it)

## Policy notes
- Make clear in UI that base resume allows discoverability; tailored resume improves chance for specific job but does not remove base discoverability unless candidate explicitly deactivates base resume.
- Logging: whenever tailored resume is uploaded, record timestamp and which job it targets.

---

# 7. Suggestions & Best Practices (short)
- **Force structured fields on job posting** (min years + must vs preferred skills) — biggest ROI for explainability.
- **Always show provenance snippets** for every claim in the candidate card — HR trusts a highlighted line more than a percentage.
- **Expose adjustable weight sliders** for hiring managers to re-balance matching for specific roles — record choice in audit log.
- **Keep confidence visible** — when confidence is low, recommend human verification steps.
- **Provide easy export (PDF) of explanation** for compliance and audit during demo.

