# SkillSync backend

FastAPI service behind SkillSync.
The [root README](../README.md) covers the architecture, Docker and the full configuration table.

## Run it

You need Python 3.11 to 3.13, [uv](https://docs.astral.sh/uv/) and PostgreSQL.

```bash
uv sync
cp .env.example .env          # set DATABASE_URL, SECRET_KEY and the Gemini keys
uv run uvicorn app.main:app --reload --port 8000
```

The app creates its tables on startup.
Interactive API docs live at http://localhost:8000/api/docs, and the health check at http://localhost:8000/api/healthcheck.

On Linux, `uv sync` installs the CPU-only torch wheel from the PyTorch index instead of the CUDA build.

## Test and lint

```bash
uv run pytest --cov           # SQLite only, no services needed
uv run ruff check .
uv run ruff format --check .
```

`tests/test_imports.py` imports every module under `app/`, so a module that imports something deleted fails the suite.

## Layout

| Path | Contents |
|---|---|
| `app/main.py` | FastAPI app, CORS and router registration |
| `app/routes/` | Endpoints, mounted under `/api` |
| `app/services/` | Resume parsing, matching, the RAG engine, email, S3 and anonymization |
| `app/models/` | SQLAlchemy models for users, internships, resumes, applications and match scores |
| `app/utils/` | JWT auth and the Gemini key manager |
| `scripts/` | One-off migrations, data loaders and diagnostics, run with `uv run python scripts/<name>.py` |
| `tests/` | pytest suite |

## Roles

| Role | Can do |
|---|---|
| student | Upload resumes, edit a profile, see recommended internships |
| company | Post internships, rank and export candidates, email candidates |
| admin | Manage users, recompute embeddings, reindex ChromaDB |
