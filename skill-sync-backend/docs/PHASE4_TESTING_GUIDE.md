# Phase 4 Testing Guide

## 🚀 Quick Start

### Prerequisites
1. **Backend server must be running:**
   ```bash
   cd skill-sync-backend
   uvicorn app.main:app --reload
   ```

2. **Database must be populated:**
   - Check `passwords/DATABASE_CREDENTIALS.md` for credentials
   - Default test account: `hr@techcorp.com` / `TechCorp2024`

### Run Quick Test (Recommended)
```bash
cd skill-sync-backend
python3 scripts/quick_test_phase4.py
```

This will:
- ✅ Check server health
- ✅ Login as company
- ✅ Get internships and candidates
- ✅ Test Task 4.1 (Candidate Explanation)
- ✅ Test Task 4.2 (Candidate Comparison)
- ✅ Test Task 4.4 (Precompute Status)

### Run Full Test Suite
```bash
cd skill-sync-backend
python3 scripts/test_phase4_implementation.py
```

---

## 📋 Manual Testing with cURL

### 1. Login
```bash
export TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@techcorp.com","password":"TechCorp2024"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### 2. Get Your Internships
```bash
curl -X GET http://localhost:8000/api/internship/my-internships \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3. Get Ranked Candidates
```bash
# Replace {internship_id} with actual ID
curl -X GET "http://localhost:8000/api/filter/rank-candidates/1/filtered?page=1&page_size=5" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 4. Task 4.1: Get Candidate Explanation
```bash
# Replace {candidate_id} and {internship_id}
curl -X GET "http://localhost:8000/api/recommendations/candidates/1/explanation?internship_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5. Task 4.2: Compare Candidates
```bash
# Replace IDs
curl -X GET "http://localhost:8000/api/recommendations/internship/1/compare?candidates=1,2" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 6. Task 4.4: Check Precompute Status
```bash
curl -X GET "http://localhost:8000/api/internship/1/precompute-status" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 7. Task 4.4: Trigger Precomputation
```bash
curl -X POST "http://localhost:8000/api/internship/1/precompute?top_n=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:**
```bash
cd skill-sync-backend
uvicorn app.main:app --reload
```
Wait for: `Application startup complete.`

### Issue: "Invalid email or password"
**Check credentials:**
```bash
cat passwords/DATABASE_CREDENTIALS.md
```
Default: `hr@techcorp.com` / `TechCorp2024`

### Issue: "No internships found"
**Populate database:**
```bash
python3 scripts/create_varied_internships.py
```

### Issue: "Explanation generation failed"
**Check:**
1. Resume data exists for candidate
2. Internship requirements are populated
3. Gemini API key is configured
4. Check logs for detailed error

### Issue: "Request timed out"
**Explanation generation can take 2-5 seconds:**
- First time: Generates new explanation
- Subsequent: Uses cached (< 1 second)
- Solution: Try precomputing first

### Issue: "Module 'requests' not found"
**Install dependencies:**
```bash
pip install requests
```

---

## 📊 Expected Results

### Task 4.1: Candidate Explanation
```json
{
  "explanation_id": "uuid-here",
  "candidate_id": 1,
  "internship_id": 1,
  "overall_score": 85.5,
  "confidence": 0.92,
  "recommendation": "SHORTLIST",
  "component_scores": {
    "semantic": 82.0,
    "skills": 88.0,
    "experience": 75.0,
    "education": 90.0,
    "projects": 85.0
  },
  "matched_skills": [...],
  "missing_skills": [...],
  "ai_recommendation": {
    "action": "SHORTLIST",
    "priority": "High",
    "strengths": ["...", "...", "..."],
    "concerns": ["...", "..."],
    "interview_questions": ["...", "...", "..."],
    "justification": "..."
  },
  "provenance": {
    "extraction_model": "gemini-2.5-flash",
    "extract_time": "2025-11-06T10:30:00"
  }
}
```

### Task 4.2: Candidate Comparison
```json
{
  "internship_id": 1,
  "better_candidate": 1,
  "score_difference": 7.5,
  "component_differences": {
    "semantic": 5.0,
    "skills": 12.0,
    "experience": 8.0
  },
  "summary": "Candidate 1 scores 7.5 points higher...",
  "audit_id": "AUD-2025-11-06-0001"
}
```

### Task 4.4: Precompute Status
```json
{
  "internship_id": 1,
  "total_matches": 50,
  "precomputed_count": 25,
  "fresh_count": 20,
  "stale_count": 5,
  "coverage_percent": 50.0,
  "needs_refresh": true
}
```

---

## ✅ Test Checklist

- [ ] Server is running on http://localhost:8000
- [ ] Can login with company credentials
- [ ] Can fetch internships
- [ ] Can fetch ranked candidates
- [ ] Task 4.1: Get candidate explanation works
- [ ] Task 4.2: Compare two candidates works
- [ ] Task 4.4: Precompute status works
- [ ] Task 4.4: Trigger precomputation works
- [ ] Task 4.5: Ranking includes cached explanations
- [ ] Audit logs are created
- [ ] Response times are acceptable

---

## 📝 Notes

1. **First Request is Slow:** Explanation generation takes 2-5 seconds on first request (Gemini API call)
2. **Caching Works:** Subsequent requests for same candidate-internship pair are instant (< 100ms)
3. **Precomputation:** Run precomputation after posting new internships for instant response times
4. **Cache Invalidation:** Explanations expire after 24 hours
5. **Error Handling:** All endpoints have proper error handling and return meaningful messages

---

## 🎯 Success Criteria

✅ All endpoints return 200 OK  
✅ Explanations include all required fields  
✅ AI recommendations are generated  
✅ Comparisons highlight differences  
✅ Precomputation processes multiple candidates  
✅ Caching reduces response time by 90%+  
✅ Audit logs are created  

---

**Last Updated:** November 6, 2025  
**Status:** Ready for Testing
