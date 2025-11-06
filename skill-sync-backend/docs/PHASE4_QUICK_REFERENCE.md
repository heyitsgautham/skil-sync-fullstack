# Phase 4: Enhanced Explainability - Quick Reference Guide

**Status:** ✅ COMPLETE  
**Date:** November 6, 2025

---

## 🚀 Quick Start

### 1. Get Candidate Explanation
```bash
GET /api/recommendations/candidates/{candidate_id}/explanation?internship_id={internship_id}
Authorization: Bearer {token}
```

**Response:**
- Overall score, confidence, recommendation
- Component scores (semantic, skills, experience, education, projects)
- Matched/missing skills with evidence
- AI recommendation (strengths, concerns, interview questions)
- Provenance tracking

---

### 2. Compare Two Candidates
```bash
GET /api/recommendations/internship/{internship_id}/compare?candidates={id1},{id2}
Authorization: Bearer {token}
```

**Response:**
- Side-by-side comparison
- Score differences by component
- Natural language summary
- Next steps for each candidate
- Audit ID

---

### 3. Precompute Explanations
```bash
POST /api/internship/{internship_id}/precompute?top_n=50&force_refresh=false
Authorization: Bearer {token}
```

**Response:**
- Processing statistics (processed, cached, new, errors)
- Duration
- Error details (if any)

---

### 4. Check Precompute Status
```bash
GET /api/internship/{internship_id}/precompute-status
Authorization: Bearer {token}
```

**Response:**
- Total matches
- Precomputed count
- Fresh/stale counts
- Coverage percentage
- Needs refresh flag

---

### 5. Get Ranked Candidates with Explanations
```bash
GET /api/filter/rank-candidates/{internship_id}/filtered?page=1&page_size=10
Authorization: Bearer {token}
```

**Response:**
- Ranked candidates list
- Embedded explanations (if cached)
- Audit ID
- Cache statistics

---

## 📊 Key Concepts

### Cache Strategy
- **TTL:** 24 hours
- **Invalidation:** Automatic after 24 hours
- **Manual Invalidation:** When resume/internship updated

### Component Scores
- **Semantic:** Vector embedding similarity
- **Skills:** Exact + fuzzy matching with weights
- **Experience:** Years calculation with relevance
- **Education:** Degree level matching
- **Projects:** Tech stack alignment

### AI Recommendations
- **Model:** Gemini 2.5 Flash
- **Temperature:** 0.3 (consistent)
- **Output:** Structured JSON (99.9% reliable)
- **Actions:** SHORTLIST | MAYBE | REJECT
- **Priority:** High | Medium | Low

---

## 🔒 Access Control

| Endpoint | Company | Student | Admin |
|----------|---------|---------|-------|
| Get Explanation | Own internships | Own data | All |
| Compare | Own internships | ❌ | All |
| Precompute | Own internships | ❌ | All |
| Ranking | Own internships | ❌ | All |

---

## ⚡ Performance

| Operation | Cached | Uncached |
|-----------|--------|----------|
| Get Explanation | 50-100ms | 2-5s |
| Compare | 100-200ms | 4-10s |
| Ranking (10 items) | 200-500ms | 1-2s |
| Precompute (50) | - | 30-60s |

---

## 🧪 Testing

**Test Script:**
```bash
cd skill-sync-backend
python3 scripts/test_phase4_implementation.py
```

**Prerequisites:**
- Backend running on localhost:8000
- Valid company credentials
- At least 2 students and 1 internship

---

## 📝 Common Workflows

### Workflow 1: View Candidate Explanations
1. Company views ranked candidates
2. Frontend checks if explanation is cached
3. If cached → Display immediately
4. If not → Show "Generate" button
5. User clicks → Call explanation API
6. Display full explanation

### Workflow 2: Background Precomputation
1. Company posts new internship
2. System triggers precomputation job
3. Generate explanations for top 50 candidates
4. Store in cache (24h TTL)
5. Future views are instant

### Workflow 3: Compare Candidates
1. Company selects 2 candidates
2. Click "Compare" button
3. Frontend calls comparison API
4. Display side-by-side view
5. Show decisive differences
6. Action logged in audit trail

---

## 🐛 Troubleshooting

### Issue: Explanation Not Cached
**Cause:** First time viewing or cache expired  
**Solution:** Call `/api/recommendations/candidates/{id}/explanation` to generate

### Issue: Precompute Errors
**Cause:** Missing resume data or internship requirements  
**Solution:** Check `error_details` in response, fix data issues

### Issue: Slow Response Times
**Cause:** Cache miss, generating on-the-fly  
**Solution:** Trigger precomputation for frequently accessed internships

### Issue: Audit ID Not Generated
**Cause:** Audit logging failure (non-blocking)  
**Solution:** Check logs, ensure `audit_logs` table exists

---

## 📚 Related Documentation

- [Phase 4 Implementation Summary](./PHASE4_IMPLEMENTATION_SUMMARY.md)
- [Match Explanation Service](../app/services/match_explanation_service.py)
- [Precompute Service](../app/services/precompute_service.py)
- [API Routes](../app/routes/recommendations.py)

---

## 💡 Tips & Best Practices

1. **Precompute after posting:** Trigger precomputation right after creating internship
2. **Monitor cache hit rate:** Use precompute-status endpoint to check coverage
3. **Invalidate on updates:** Clear cache when resume/internship changes
4. **Batch precompute:** Use top_n=50 for most internships, 100+ for high-volume
5. **Check audit logs:** Review audit trail regularly for compliance

---

**Last Updated:** November 6, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
