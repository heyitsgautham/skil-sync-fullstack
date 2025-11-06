# Testing Guide - ChromaDB Management UI

## 🧪 Complete Testing Checklist

### Prerequisites
```bash
# 1. Start backend server
cd skill-sync-backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start frontend server (separate terminal)
cd skill-sync-frontend
npm start
```

### Test Account
```
Email: admin@skillsync.com
Password: admin123
```

---

## 📋 Test Cases

### Test 1: Initial Load ✅
**Steps:**
1. Login as admin
2. Navigate to Dashboard

**Expected:**
- [ ] 6 cards displayed in grid layout
- [ ] "Clear Embeddings" card shows (red, bottom-left)
- [ ] "Re-index All Students" card shows (orange, bottom-right)
- [ ] System status fetches automatically
- [ ] Current counts display in Clear Embeddings card

**Screenshot Location:** Before any operations

---

### Test 2: System Status Display ✅
**Steps:**
1. Check "Clear Embeddings" card
2. Verify status badge shows

**Expected:**
- [ ] "📊 Current Status" badge visible
- [ ] Shows "Total Resumes: X"
- [ ] Shows "With Embeddings: X"
- [ ] Shows "Total Matches: X"
- [ ] Numbers are accurate (check backend)

**Backend Verification:**
```bash
curl -X GET "http://localhost:8000/api/admin/system-status" \
  -H "Authorization: Bearer <token>"
```

---

### Test 3: Clear ChromaDB Dialog ✅
**Steps:**
1. Click "Clear ChromaDB" button
2. Dialog should open

**Expected:**
- [ ] Dialog opens immediately
- [ ] Title: "⚠️ Clear All ChromaDB Embeddings"
- [ ] Warning icon (red) in title
- [ ] Lists 3 bullet points of what will be deleted
- [ ] Shows red warning text: "This action cannot be undone"
- [ ] Shows current counts in status box
- [ ] Cancel button (outlined)
- [ ] "Yes, Delete Everything" button (red, contained)

**Test Interactions:**
- [ ] Click outside dialog → Should close
- [ ] Press ESC key → Should close
- [ ] Click Cancel → Should close
- [ ] Click X (if present) → Should close

---

### Test 4: Clear ChromaDB Execution ✅
**Steps:**
1. Click "Clear ChromaDB" button
2. Click "Yes, Delete Everything"

**Expected:**
- [ ] Dialog closes immediately
- [ ] Button text changes to "Clearing..."
- [ ] Button shows spinner icon
- [ ] Button is disabled (grayed out)
- [ ] After 1-2 seconds: Success notification
- [ ] Notification shows deleted counts
- [ ] System status refreshes automatically
- [ ] Counts update to 0 embeddings
- [ ] Button re-enables

**Success Notification:**
```
✅ Successfully cleared ChromaDB! 
   50 embeddings and 150 matches deleted.
```

**Backend Verification:**
```bash
# Should return 0 embeddings
curl -X GET "http://localhost:8000/api/admin/system-status" \
  -H "Authorization: Bearer <token>"
```

---

### Test 5: Clear ChromaDB Error Handling ❌
**Steps:**
1. Stop backend server
2. Click "Clear ChromaDB"
3. Confirm dialog

**Expected:**
- [ ] Error notification appears
- [ ] Message: "Failed to clear ChromaDB. Please try again."
- [ ] Button re-enables
- [ ] Red error snackbar at bottom

---

### Test 6: Reindex Dialog ✅
**Steps:**
1. Click "Re-index Resumes" button
2. Dialog should open

**Expected:**
- [ ] Dialog opens immediately
- [ ] Title: "☁️ Re-index All 50 Student Resumes"
- [ ] Orange icon in title
- [ ] Lists 5 bullet points of process
- [ ] Shows estimated time (2-5 minutes)
- [ ] Blue info alert about background task
- [ ] Cancel button (outlined)
- [ ] "Start Re-indexing" button (orange gradient)

**Process Description Should Include:**
- [ ] "Extract text from all resume files"
- [ ] "Parse each resume using Gemini AI (consumes API credits)"
- [ ] "Generate new embeddings using HuggingFace"
- [ ] "Update PostgreSQL database and ChromaDB"
- [ ] "Recalculate all student-internship matches"

---

### Test 7: Reindex Execution ✅
**Steps:**
1. Click "Re-index Resumes" button
2. Click "Start Re-indexing"

**Expected:**
- [ ] Dialog closes immediately
- [ ] Button text changes to "Reindexing..."
- [ ] Button shows spinner icon
- [ ] Button is disabled (grayed out)
- [ ] Immediate notification: "Started reindexing 50 student resumes"
- [ ] Yellow progress box appears in card
- [ ] Progress box shows: "⏳ Reindexing in progress..."
- [ ] After 30 seconds: Success notification
- [ ] System status refreshes
- [ ] Button re-enables
- [ ] Progress box disappears

**Backend Logs to Check:**
```bash
# Watch backend logs
tail -f logs/app.log

# Look for:
🔄 Admin admin@skillsync.com initiated full resume reindexing
📊 Found 50 resume files to process
📄 Processing: alex_resume.pdf
✅ Successfully processed: alex_resume.pdf
... (50 times)
🎉 Reindexing completed! Success: 50, Failed: 0
```

---

### Test 8: Reindex Error Handling ❌
**Steps:**
1. Stop backend server
2. Click "Re-index Resumes"
3. Confirm dialog

**Expected:**
- [ ] Error notification appears
- [ ] Message: "Failed to start reindexing. Please try again."
- [ ] Button re-enables
- [ ] No progress box appears

---

### Test 9: Concurrent Operations ⚠️
**Steps:**
1. Click "Recompute Embeddings" (starts processing)
2. Try clicking "Clear ChromaDB"

**Expected:**
- [ ] Both can be triggered independently
- [ ] Each operation maintains its own loading state
- [ ] No interference between operations
- [ ] Notifications show for each completion

---

### Test 10: Multiple Clear Operations 🔄
**Steps:**
1. Clear ChromaDB (first time)
2. Wait for completion
3. Try to clear again

**Expected:**
- [ ] Second clear shows 0 embeddings to delete
- [ ] Still allows operation (idempotent)
- [ ] Returns success with 0 counts

---

### Test 11: Reindex After Clear ✅
**Complete Flow:**
1. Clear ChromaDB
2. Wait for completion (counts go to 0)
3. Reindex all students
4. Wait 30 seconds
5. Check system status

**Expected:**
- [ ] Clear: Embeddings drop to 0
- [ ] Clear: Matches drop to 0
- [ ] Reindex: Background task starts
- [ ] After 30s: Embeddings restored to 50
- [ ] After 30s: Matches restored to ~150
- [ ] All operations complete successfully

**Full Workflow Verification:**
```bash
# Before clear
curl -X GET "http://localhost:8000/api/admin/system-status" -H "Authorization: Bearer <token>"
# → embeddings: 50, matches: 150

# After clear
# → embeddings: 0, matches: 0

# After reindex (wait 30s)
# → embeddings: 50, matches: 150
```

---

### Test 12: Responsive Design 📱

**Desktop (>960px):**
- [ ] 3 columns visible
- [ ] Cards side by side
- [ ] Hover animations work

**Tablet (600-960px):**
- [ ] 2 columns visible
- [ ] Cards arrange 2 per row
- [ ] Touch interactions work

**Mobile (<600px):**
- [ ] 1 column visible
- [ ] Cards stack vertically
- [ ] Dialogs fit screen
- [ ] Buttons are tappable

---

### Test 13: Loading States 🔄

**Clear ChromaDB:**
- [ ] Button shows spinner (not icon)
- [ ] Button text: "Clearing..."
- [ ] Button is disabled
- [ ] Gradient changes to gray
- [ ] Hover animation disabled

**Reindex:**
- [ ] Button shows spinner (not icon)
- [ ] Button text: "Reindexing..."
- [ ] Button is disabled
- [ ] Gradient changes to gray
- [ ] Progress box appears
- [ ] Hover animation disabled

---

### Test 14: Notifications 🔔

**Position:**
- [ ] Appears at bottom center
- [ ] Slides up smoothly
- [ ] Auto-dismisses after 6 seconds
- [ ] Can be manually dismissed (X button)

**Colors:**
- [ ] Success (green) for completed operations
- [ ] Error (red) for failures
- [ ] Info (blue) for background tasks

**Messages:**
- [ ] Clear success: Shows counts
- [ ] Reindex start: Shows file count + time
- [ ] Reindex complete: Confirmation message
- [ ] Errors: Clear, actionable messages

---

### Test 15: Browser Compatibility 🌐

**Chrome:**
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors

**Firefox:**
- [ ] All features work
- [ ] Gradient rendering correct
- [ ] Dialog behavior correct

**Safari:**
- [ ] All features work
- [ ] Backdrop blur works
- [ ] Animations smooth

**Edge:**
- [ ] All features work
- [ ] Material-UI renders correctly

---

### Test 16: Accessibility ♿

**Keyboard Navigation:**
- [ ] Tab through cards
- [ ] Space/Enter to click buttons
- [ ] Tab through dialog buttons
- [ ] ESC to close dialogs

**Screen Reader:**
- [ ] Cards have descriptive labels
- [ ] Buttons announce state
- [ ] Dialogs announce content
- [ ] Warning messages are emphasized

**Color Contrast:**
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Buttons meet WCAG AA
- [ ] Warning colors are distinguishable

---

### Test 17: Performance 🚀

**Initial Load:**
- [ ] Dashboard loads in <2s
- [ ] System status fetches in <1s
- [ ] No layout shifts
- [ ] Images/icons load quickly

**Operations:**
- [ ] Clear completes in 1-2s
- [ ] Reindex starts immediately
- [ ] UI remains responsive during operations
- [ ] No memory leaks on repeated operations

---

### Test 18: Edge Cases 🐛

**Empty State:**
- [ ] Works when 0 resumes exist
- [ ] Shows 0 in status badge
- [ ] Clear operation handles gracefully
- [ ] Reindex handles no files found

**Partial Failures:**
- [ ] Reindex continues on single file failure
- [ ] Shows success count + failed count
- [ ] Logs errors for failed resumes

**Network Issues:**
- [ ] Timeout handled gracefully
- [ ] Retry mechanism (if implemented)
- [ ] Clear error messages

---

## 📊 Test Results Template

```
Test Run: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari/Edge]
Device: [Desktop/Tablet/Mobile]

┌─────────────────────────────────┬──────┬──────────┐
│ Test Case                       │ Pass │ Notes    │
├─────────────────────────────────┼──────┼──────────┤
│ 1. Initial Load                 │  ✅  │          │
│ 2. System Status Display        │  ✅  │          │
│ 3. Clear ChromaDB Dialog        │  ✅  │          │
│ 4. Clear ChromaDB Execution     │  ✅  │          │
│ 5. Clear ChromaDB Error         │  ✅  │          │
│ 6. Reindex Dialog               │  ✅  │          │
│ 7. Reindex Execution            │  ✅  │          │
│ 8. Reindex Error                │  ✅  │          │
│ 9. Concurrent Operations        │  ✅  │          │
│ 10. Multiple Clear Operations   │  ✅  │          │
│ 11. Reindex After Clear         │  ✅  │          │
│ 12. Responsive Design           │  ✅  │          │
│ 13. Loading States              │  ✅  │          │
│ 14. Notifications               │  ✅  │          │
│ 15. Browser Compatibility       │  ✅  │          │
│ 16. Accessibility               │  ✅  │          │
│ 17. Performance                 │  ✅  │          │
│ 18. Edge Cases                  │  ✅  │          │
└─────────────────────────────────┴──────┴──────────┘

Overall Status: PASS / FAIL
Comments: [Any issues found]
```

---

## 🎬 Demo Script

For presenting the feature to stakeholders:

### 1. Introduction (30 seconds)
"I'll show you two new admin features for managing ChromaDB embeddings..."

### 2. System Status (15 seconds)
"First, we can see the current state: 50 resumes, 50 embeddings, 150 matches."

### 3. Clear Demo (1 minute)
"Let's clear all embeddings... [click button] ... confirmation dialog appears with warning... [confirm] ... Done! Embeddings cleared."

### 4. Reindex Demo (1 minute)
"Now let's rebuild everything... [click button] ... explains full process... [confirm] ... Background task started, will complete in 2-5 minutes."

### 5. Verification (30 seconds)
"After waiting... [refresh] ... Everything restored! 50 embeddings, 150 matches."

### 6. Safety Features (1 minute)
"Notice: Confirmation dialogs prevent accidents, loading states show progress, notifications provide feedback, system status updates automatically."

---

## 🐛 Known Issues

Track any bugs found during testing:

```
┌─────┬────────────────────┬──────────┬───────────┬──────────┐
│ ID  │ Description        │ Severity │ Status    │ Fix Date │
├─────┼────────────────────┼──────────┼───────────┼──────────┤
│ #1  │ [Description]      │ High     │ Open      │          │
└─────┴────────────────────┴──────────┴───────────┴──────────┘
```

---

## ✅ Sign-off

Once all tests pass:

```
Frontend Implementation: COMPLETE ✅
Backend Integration: VERIFIED ✅
User Experience: APPROVED ✅
Security: VERIFIED ✅
Performance: ACCEPTABLE ✅
Accessibility: COMPLIANT ✅

Approved By: _______________
Date: _______________
```

---

Start testing! 🧪🚀
