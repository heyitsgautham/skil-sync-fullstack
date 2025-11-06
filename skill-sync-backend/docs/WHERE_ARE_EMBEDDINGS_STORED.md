# Where Are ChromaDB Embeddings Stored? 🔍

## 🎯 Quick Answer

Your embeddings are stored in **THREE places**:

1. **`data/chroma_db/chroma.sqlite3`** - Metadata and references
2. **`data/chroma_db/<UUID>/`** folders - Actual vector data (binary files)
3. **PostgreSQL `resumes` table** - Copy of embedding vectors + embedding_id

---

## 📊 Current Status (After "Clear Embeddings")

Based on the inspection script output:

### ❌ Embeddings Were NOT Actually Cleared!

```
Resume Collection: 53 items (should be 0!)
Internship Collection: 9 items (stays as-is, correct)
PostgreSQL: 0 embedding_ids (correct), but 2 embeddings still exist
```

**The clear operation had a PARTIAL failure!** Here's what happened:

---

## 🐛 Why Did Clear Fail?

Looking at the inspection output, there's an issue with the `delete_resume_embedding()` method. Let me check the code:

### Problem: Wrong deletion approach
The current code tries to delete embeddings one-by-one, but ChromaDB's `delete()` method requires IDs to exist. When clearing all, it's better to use `collection.delete()` with a query or reset the collection.

---

## 🗂️ ChromaDB Storage Structure

### 1. SQLite Database (`chroma.sqlite3`)
- **Location:** `/data/chroma_db/chroma.sqlite3`
- **Size:** 3.43 MB
- **Contains:**
  - Collection metadata (names, IDs)
  - Document IDs and metadata
  - Segment information
  - Full-text search indices

**Tables:**
```
collections       → Collection names and IDs
embeddings        → References to vector data
embedding_metadata → Metadata for each embedding
segments          → Pointers to binary vector files
```

### 2. Vector Binary Files
- **Location:** `/data/chroma_db/<UUID>/`
- **Two folders in your system:**
  ```
  7160dbb5-e498-4545-aef7-96547c5b578d/  → Resume embeddings (1.6 MB)
  3e9b45a5-af0e-457c-8ba8-5e71e839b864/  → Internship embeddings (1.6 MB)
  ```

**Binary Files:**
- `data_level0.bin` - Actual embedding vectors (1.6 MB each)
- `header.bin` - HNSW index header (100 bytes)
- `length.bin` - Vector lengths (3.91 KB)
- `link_lists.bin` - Graph connections for HNSW search (0 bytes = empty)

### 3. PostgreSQL Database
- **Location:** PostgreSQL server (connection in `.env`)
- **Table:** `resumes`
- **Columns:**
  - `embedding` - JSON array of 384 float numbers
  - `embedding_id` - Reference to ChromaDB ID (e.g., "resume_12345")

---

## 🔍 What the Inspection Script Showed

### Resume Collection (ChromaDB)
```
Total items: 53 ❌ (should be 0 after clear!)

Sample IDs:
- resume_ba77b743-e472-404e-9fc9-8bb5e45871ef
- resume_fe4bbbb4-265d-488a-8995-2ddb901026a7
- resume_31f352f2-da4a-4ab6-a418-2bb40dd6b9b3
...
```

**This shows the clear operation FAILED!** ChromaDB still has 53 resume embeddings.

### Internship Collection (ChromaDB)
```
Total items: 9 ✅ (correct - internships should NOT be cleared)

Sample IDs:
- internship_1
- internship_2
- internship_3
...
```

### PostgreSQL Database
```
Total resumes: 66
With embedding vector: 2 ⚠️ (2 old embeddings still exist)
With embedding_id: 0 ✅ (correctly cleared)
```

---

## 🛠️ How to Properly Clear Embeddings

### Option 1: Use the Fixed API Endpoint (Recommended)
I'll fix the backend code to properly clear ChromaDB.

### Option 2: Manual Cleanup (If needed now)
```bash
# Stop the backend server first!

# Delete the entire ChromaDB directory
rm -rf data/chroma_db/

# Restart the server - ChromaDB will recreate empty collections
```

### Option 3: Python Script
```python
from app.services.rag_engine import rag_engine

# Get all resume IDs
result = rag_engine.resume_collection.get()
all_ids = result['ids']

# Delete all at once
if all_ids:
    rag_engine.resume_collection.delete(ids=all_ids)

print(f"Deleted {len(all_ids)} embeddings")
```

---

## 🔧 Fix the Backend Code

The issue is in `/app/services/rag_engine.py` - the `delete_resume_embedding()` method. Let me create a better version:

### Current (Broken) Approach:
```python
def delete_resume_embedding(self, resume_id: str) -> bool:
    """Delete resume embedding from vector database"""
    try:
        embedding_id = f"resume_{resume_id}"
        self.resume_collection.delete(ids=[embedding_id])
        return True
    except Exception as e:
        logger.error(f"Error deleting resume {resume_id}: {e}")
        return False
```

**Problem:** When the ID doesn't exist or format is wrong, `delete()` fails silently.

### Fixed Approach:
```python
def clear_all_resume_embeddings(self) -> int:
    """Clear ALL resume embeddings from ChromaDB"""
    try:
        # Get all IDs first
        result = self.resume_collection.get()
        all_ids = result['ids']
        count = len(all_ids)
        
        # Delete all at once
        if count > 0:
            self.resume_collection.delete(ids=all_ids)
        
        logger.info(f"Cleared {count} resume embeddings from ChromaDB")
        return count
    except Exception as e:
        logger.error(f"Error clearing resume embeddings: {e}")
        return 0
```

---

## 📁 Visual Directory Structure

```
skill-sync-backend/
└── data/
    └── chroma_db/                          ← Main ChromaDB directory
        ├── chroma.sqlite3                  ← Metadata database (3.43 MB)
        │                                   ├─ Collections table
        │                                   ├─ Embeddings references
        │                                   └─ Search indices
        │
        ├── 7160dbb5.../                    ← Resume vectors (UUID folder)
        │   ├── data_level0.bin             ← Actual embeddings (1.6 MB)
        │   ├── header.bin                  ← HNSW header (100 B)
        │   ├── length.bin                  ← Vector lengths (3.91 KB)
        │   └── link_lists.bin              ← Graph links (0 B)
        │
        └── 3e9b45a5.../                    ← Internship vectors (UUID folder)
            ├── data_level0.bin             ← Actual embeddings (1.6 MB)
            ├── header.bin                  ← HNSW header (100 B)
            ├── length.bin                  ← Vector lengths (3.91 KB)
            └── link_lists.bin              ← Graph links (0 B)
```

**Total Size:** 6.63 MB

---

## 🎯 What "Clear Embeddings" Should Do

### Backend Operation Flow:
1. ✅ Query PostgreSQL for all resumes with embeddings
2. ✅ Get their `embedding_id` values
3. ❌ Call `delete_resume_embedding()` for each (FAILS!)
4. ✅ Set `embedding_id = NULL` in PostgreSQL
5. ✅ Set `embedding = NULL` in PostgreSQL
6. ✅ Delete all student-internship matches
7. ❌ ChromaDB still has 53 embeddings (BUG!)

### What Actually Happened:
```
PostgreSQL:
  ✅ embedding_id: 66 → 0 (cleared)
  ⚠️  embedding: 66 → 2 (mostly cleared)
  ✅ matches: 150 → 0 (cleared)

ChromaDB:
  ❌ resume_collection: 53 → 53 (NOT cleared!)
  ✅ internship_collection: 9 → 9 (unchanged, correct)
```

---

## 🔧 I'll Fix This Now

I need to update the backend code to properly clear ChromaDB. The issue is that the `delete_resume_embedding()` method doesn't work correctly when called in a loop.

**Fix:** Add a `clear_all_resume_embeddings()` method that deletes all at once.

---

## 📊 How to Verify After Fix

Run the inspection script again:
```bash
cd skill-sync-backend
python scripts/inspect_chromadb.py
```

**Expected after successful clear:**
```
Resume Collection: 0 items ✅
Internship Collection: 9 items ✅
PostgreSQL embedding_id: 0 ✅
PostgreSQL embedding: 0 ✅
```

---

## 🎓 Key Takeaways

1. **ChromaDB uses hybrid storage:**
   - SQLite for metadata
   - Binary files for vectors
   - Both must be cleared

2. **Binary files may persist:**
   - Even after clearing, files stay on disk
   - They just contain no data (empty indices)
   - This is normal ChromaDB behavior

3. **PostgreSQL is separate:**
   - Has its own copy of embeddings
   - Must be cleared independently
   - Links to ChromaDB via `embedding_id`

4. **Clear operation has 3 parts:**
   - Clear ChromaDB collections
   - Clear PostgreSQL embedding columns
   - Clear student-internship matches

---

Let me fix the backend code now! 🔧
