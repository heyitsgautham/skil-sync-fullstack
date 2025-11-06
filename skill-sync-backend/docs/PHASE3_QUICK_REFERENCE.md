# Phase 3 Quick Reference Guide

## 🎯 Quick Start

### Extract Skills from Job Description
```python
from app.services.skill_extraction_service import get_skill_extraction_service

extraction = get_skill_extraction_service()
skills = extraction.extract_skills_from_description(
    title="Full Stack Developer",
    description="Looking for React and Node.js experience...",
    num_suggestions=15
)
```

### Use Skill Taxonomy
```python
from app.services.skill_taxonomy_service import get_skill_taxonomy_service

taxonomy = get_skill_taxonomy_service()
matches = taxonomy.find_skill_matches("React, Node.js, Python", min_confidence=0.75)
category = taxonomy.categorize_skill("React")  # Returns "Frontend"
normalized = taxonomy.normalize_skill_name("reactjs")  # Returns "React"
```

---

## 📡 API Endpoints

### Extract Skills
```bash
POST /api/internship/extract-skills
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Backend Engineer",
  "description": "Build APIs with Python and Django...",
  "num_suggestions": 15
}

Response:
{
  "skills": [...],
  "suggested_must_have": ["Python", "Django"],
  "suggested_preferred": ["Docker"],
  "highlighted_html": "<p>Build APIs with <mark>Python</mark>...</p>"
}
```

### Create Job Posting (Enhanced)
```bash
POST /api/internship/post
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Backend Engineer",
  "description": "...",
  "required_skills": ["Python", "Django"],
  "preferred_skills": ["Docker", "AWS"],
  "preferred_years": 1.5,
  "rubric_weights": {
    "semantic": 0.35,
    "skills": 0.30,
    "experience": 0.20,
    "education": 0.10,
    "projects": 0.05
  },
  "extracted_skills_raw": [...],
  "requires_portfolio": true,
  "role_level": "Intern"
}
```

---

## 🔧 Common Use Cases

### 1. Extract and Highlight Skills
```python
extraction = get_skill_extraction_service()
skills = extraction.extract_skills_from_description(title, description)
highlighted = extraction.highlight_skills_in_text(description, skills)
```

### 2. Categorize Skills (Must-Have vs Preferred)
```python
categorized = extraction.categorize_extracted_skills(
    skills, 
    required_threshold=0.8
)
must_have = categorized["must_have"]
preferred = categorized["preferred"]
```

### 3. Validate and Normalize Skills
```python
taxonomy = get_skill_taxonomy_service()
is_valid = taxonomy.is_valid_skill("React")
normalized = taxonomy.normalize_skill_name("reactjs")
aliases = taxonomy.get_skill_aliases("React")
```

---

## 🧪 Testing

Run Phase 3 test suite:
```bash
cd skill-sync-backend
python3 scripts/test_phase3_skill_extraction.py
```

Expected output:
- ✅ Taxonomy loads 120+ skills
- ✅ AI extraction finds 15 skills
- ✅ Confidence scores 0.90-1.00
- ✅ HTML highlighting generated

---

## 📊 Skill Taxonomy Structure

```json
{
  "skills": [
    {
      "name": "React",
      "category": "Frontend",
      "aliases": ["ReactJS", "React.js", "React Framework"]
    }
  ]
}
```

**Categories:**
- Frontend (14 skills)
- Backend (22 skills)
- Database (10 skills)
- DevOps (10 skills)
- Cloud (3 skills)
- AI/ML (8 skills)
- Data Science (8 skills)
- Soft Skills (8 skills)
- Testing (5 skills)
- Design (4 skills)
- Security (3 skills)
- Mobile (6 skills)
- Emerging Tech (3 skills)
- Tools (8 skills)

---

## ⚠️ Important Notes

1. **Gemini API Key Required:** Set `GEMINI_KEY_SKILLS_EXTRACTION` in `.env`
2. **Company-Only Access:** Skill extraction endpoint requires company role
3. **Rubric Weights Validation:** Must sum to 1.0
4. **Fallback Extraction:** Taxonomy-based if Gemini fails
5. **Rate Limiting:** Key manager handles rotation automatically

---

## 🔗 Related Files

- **Services:** `app/services/skill_taxonomy_service.py`, `skill_extraction_service.py`
- **Routes:** `app/routes/internship.py`
- **Data:** `data/skill_taxonomy.json`
- **Tests:** `scripts/test_phase3_skill_extraction.py`
- **Docs:** `docs/PHASE3_IMPLEMENTATION_SUMMARY.md`

---

## 🐛 Troubleshooting

### Issue: Skills not extracted
- Check Gemini API key is set
- Verify company authentication
- Check fallback extraction works

### Issue: Wrong categories
- Update `skill_taxonomy.json`
- Restart service to reload taxonomy

### Issue: Low confidence scores
- Improve job description clarity
- Adjust Gemini prompt in service
- Lower threshold in categorization

---

## 📞 Support

For questions about Phase 3 implementation:
1. Check `PHASE3_IMPLEMENTATION_SUMMARY.md`
2. Review test script output
3. Check task list in `tasks.md`
