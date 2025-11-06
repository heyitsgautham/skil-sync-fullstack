# Admin ChromaDB Management - Quick Reference

## 🎯 Quick Start

### 1. Clear All Embeddings
```bash
# Via API
curl -X POST "http://localhost:8000/api/admin/clear-chromadb" \
  -H "Authorization: Bearer <admin_token>"

# Via Test Script
./scripts/test_admin_chromadb.sh
# → Type "yes" when prompted to clear
```

### 2. Reindex All 50 Students
```bash
# Via API
curl -X POST "http://localhost:8000/api/admin/reindex-all-students" \
  -H "Authorization: Bearer <admin_token>"

# Via Test Script
./scripts/test_admin_chromadb.sh
# → Type "yes" when prompted to reindex
```

### 3. Check System Status
```bash
# Via API
curl -X GET "http://localhost:8000/api/admin/system-status" \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🔄 Typical Workflows

### Scenario 1: After Gemini API Changes
```bash
1. Clear embeddings:    POST /api/admin/clear-chromadb
2. Reindex all resumes: POST /api/admin/reindex-all-students
3. Check status:        GET /api/admin/system-status
```

### Scenario 2: Adding New Student Resumes
```bash
1. Upload PDFs to app/public/resumes/
2. Reindex all resumes: POST /api/admin/reindex-all-students
3. Check status:        GET /api/admin/system-status
```

### Scenario 3: Troubleshooting Bad Matches
```bash
1. Check current stats:  GET /api/admin/system-status
2. Clear embeddings:     POST /api/admin/clear-chromadb
3. Reindex all resumes:  POST /api/admin/reindex-all-students
4. Verify restoration:   GET /api/admin/system-status
```

---

## 📊 Expected Results

### Before Clear
```json
{
  "resumes": {"total": 50, "with_embeddings": 50},
  "matches": {"total": 150}
}
```

### After Clear
```json
{
  "resumes": {"total": 50, "with_embeddings": 0},
  "matches": {"total": 0}
}
```

### After Reindex (wait 2-5 minutes)
```json
{
  "resumes": {"total": 50, "with_embeddings": 50},
  "matches": {"total": 150}
}
```

---

## ⏱️ Timing

| Operation | Duration |
|-----------|----------|
| Clear embeddings | 1-2 seconds |
| Reindex 50 resumes | 2-5 minutes |
| Single resume processing | 2-5 seconds |

---

## 🚨 Important Notes

1. **Destructive Operations**: Clear embeddings is PERMANENT
2. **Background Processing**: Reindex runs async (check logs)
3. **Admin Only**: Both endpoints require admin role
4. **Resume Naming**: Files must match student email prefix
   - ✅ `alex_resume.pdf` → `alex@university.edu`
   - ✅ `john-doe_cv.docx` → `john@university.edu`
   - ❌ `resume_1.pdf` → No match
5. **API Keys**: Uses 10 Gemini keys with automatic rotation
6. **Internship Embeddings**: NOT cleared (only student embeddings)

---

## 🔍 Monitoring

### Check Server Logs
```bash
# Watch real-time progress
tail -f logs/app.log

# Look for these indicators:
🗑️  - ChromaDB cleanup initiated
📊 - Found X resumes to process
✅ - Successfully processed
❌ - Failed to process
🎉 - Reindexing completed
```

### Check Database
```bash
# Connect to PostgreSQL
psql -U postgres -d skillsync

# Check resume counts
SELECT COUNT(*) FROM resumes WHERE is_active = 1;
SELECT COUNT(*) FROM resumes WHERE embedding IS NOT NULL;
SELECT COUNT(*) FROM student_internship_matches;
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 403 Forbidden | Login as admin user |
| No files found | Check `app/public/resumes/` directory |
| Student not found | Fix resume filename to match email |
| Rate limit errors | Wait 1 minute, API will auto-retry |
| Slow reindexing | Normal - 50 resumes take 2-5 minutes |

---

## 📞 Support

- Check logs: `logs/app.log`
- View errors: Look for ❌ emoji in logs
- Test script: `./scripts/test_admin_chromadb.sh`
- Documentation: `docs/CHROMADB_MANAGEMENT.md`
