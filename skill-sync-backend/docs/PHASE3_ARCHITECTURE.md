# Phase 3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 3: SKILL EXTRACTION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                                  ┌──────────────┐
                                  │   Company    │
                                  │   (HR User)  │
                                  └──────┬───────┘
                                         │
                                         │ 1. Post Job Description
                                         ▼
                            ┌────────────────────────────┐
                            │  POST /api/internship/     │
                            │     extract-skills         │
                            │  ────────────────────      │
                            │  • Auth: Company Only      │
                            │  • Input: title, desc      │
                            │  • Output: Skills + HTML   │
                            └────────────┬───────────────┘
                                         │
                                         │ 2. Call Service
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │   SkillExtractionService                   │
                    │   ─────────────────────────                │
                    │   extract_skills_from_description()        │
                    │   • Builds Gemini prompt                   │
                    │   • Calls AI for extraction                │
                    │   • Parses JSON response                   │
                    │   • Enriches with taxonomy                 │
                    └─────────────┬─────────────┬────────────────┘
                                  │             │
                   3a. AI Call    │             │ 3b. Enrich
                                  ▼             ▼
                    ┌──────────────────┐  ┌─────────────────────┐
                    │  Gemini 2.0      │  │ SkillTaxonomy       │
                    │  Flash API       │  │ Service             │
                    │  ──────────      │  │ ────────────        │
                    │  Model:          │  │ • 120+ skills       │
                    │  gemini-2.0-     │  │ • 14 categories     │
                    │  flash-exp       │  │ • Fuzzy matching    │
                    │                  │  │ • Normalization     │
                    │  Returns:        │  │ • Alias resolution  │
                    │  [{skill, conf,  │  │                     │
                    │    category,     │  │  Data:              │
                    │    span}]        │  │  skill_taxonomy.json│
                    └──────────────────┘  └─────────────────────┘
                                  │             │
                                  └──────┬──────┘
                                         │
                                         │ 4. Return Enriched Skills
                                         ▼
                            ┌────────────────────────────┐
                            │  Response to Company       │
                            │  ─────────────────         │
                            │  • skills: [{...}]         │
                            │  • suggested_must_have     │
                            │  • suggested_preferred     │
                            │  • highlighted_html        │
                            └────────────┬───────────────┘
                                         │
                                         │ 5. Review & Edit
                                         ▼
                                  ┌──────────────┐
                                  │   Company    │
                                  │   Reviews    │
                                  │   • Edits    │
                                  │   • Confirms │
                                  └──────┬───────┘
                                         │
                                         │ 6. Submit Final Job
                                         ▼
                            ┌────────────────────────────┐
                            │  POST /api/internship/post │
                            │  ────────────────────────  │
                            │  Enhanced with:            │
                            │  • required_skills         │
                            │  • preferred_skills        │
                            │  • rubric_weights          │
                            │  • skill_weights           │
                            │  • extracted_skills_raw    │
                            │  • + 8 more fields         │
                            └────────────┬───────────────┘
                                         │
                                         │ 7. Store in Database
                                         ▼
                                  ┌──────────────┐
                                  │  PostgreSQL  │
                                  │  ──────────  │
                                  │  internships │
                                  │  table       │
                                  │  (with 13    │
                                  │   new fields)│
                                  └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                            KEY COMPONENTS                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SkillTaxonomyService                                                        │
│     • Manages skill vocabulary                                                  │
│     • Provides fuzzy matching                                                   │
│     • Normalizes skill names                                                    │
│     • Resolves aliases                                                          │
│                                                                                  │
│  2. SkillExtractionService                                                      │
│     • Calls Gemini AI                                                           │
│     • Parses AI response                                                        │
│     • Enriches with taxonomy                                                    │
│     • Generates highlighted HTML                                                │
│     • Categorizes skills                                                        │
│                                                                                  │
│  3. API Endpoints                                                               │
│     • POST /api/internship/extract-skills (new)                                │
│     • POST /api/internship/post (enhanced)                                     │
│                                                                                  │
│  4. Data Sources                                                                │
│     • skill_taxonomy.json (120+ skills)                                        │
│     • Gemini 2.0 Flash API                                                     │
│     • PostgreSQL database                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SKILL EXTRACTION EXAMPLE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INPUT (Job Description):                                                       │
│  "Looking for Full Stack Developer with React, Node.js, and PostgreSQL          │
│   experience. Docker knowledge is a plus."                                      │
│                                                                                  │
│                             ▼ AI Processing ▼                                   │
│                                                                                  │
│  GEMINI EXTRACTION:                                                             │
│  [                                                                               │
│    {skill: "React", category: "tech", confidence: 1.0, span: [38, 43]},        │
│    {skill: "Node.js", category: "tech", confidence: 1.0, span: [45, 52]},      │
│    {skill: "PostgreSQL", category: "tech", confidence: 1.0, span: [58, 68]},   │
│    {skill: "Docker", category: "tech", confidence: 0.85, span: [81, 87]}       │
│  ]                                                                               │
│                                                                                  │
│                           ▼ Taxonomy Enrichment ▼                               │
│                                                                                  │
│  ENRICHED OUTPUT:                                                               │
│  {                                                                               │
│    skills: [                                                                     │
│      {skill: "React", category: "Frontend", confidence: 1.0, in_taxonomy: true},│
│      {skill: "Node.js", category: "Backend", confidence: 1.0, in_taxonomy: true},│
│      {skill: "PostgreSQL", category: "Database", confidence: 1.0, ...},         │
│      {skill: "Docker", category: "DevOps", confidence: 0.85, ...}               │
│    ],                                                                            │
│    suggested_must_have: ["React", "Node.js", "PostgreSQL"],                    │
│    suggested_preferred: ["Docker"],                                             │
│    highlighted_html: "Looking for... <mark>React</mark>, <mark>Node.js</mark>" │
│  }                                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Integration Flow

```
Company User Journey:
1. Creates job posting
2. Clicks "Extract Skills" button
3. AI analyzes description → 2-3 seconds
4. Reviews suggested skills
5. Edits/confirms skills
6. Sets must-have vs preferred
7. Submits job posting
8. All data stored in database

Backend Processing:
1. Receives job description
2. Calls Gemini API with structured prompt
3. Parses JSON response
4. Enriches with taxonomy data
5. Generates HTML highlighting
6. Categorizes by confidence
7. Returns to frontend
8. Stores final version in DB
```

## Error Handling & Fallbacks

```
Gemini API Failure → Taxonomy-based extraction
Invalid JSON → Parse and fix
Rate Limiting → Key rotation (automatic)
Network Error → Retry with backoff
```

## Performance Characteristics

```
Skill Extraction: 2-3 seconds (AI)
Fallback Extraction: <100ms (taxonomy)
HTML Generation: <50ms
Database Storage: <100ms
Total Response Time: ~3 seconds
```
