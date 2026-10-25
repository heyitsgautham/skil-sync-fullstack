# SkillSync

[![CI](https://github.com/heyitsgautham/skil-sync-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/heyitsgautham/skil-sync-fullstack/actions/workflows/ci.yml)

SkillSync matches students to internships.
Students upload resumes, companies post internships, and the backend ranks candidates for each posting with embeddings plus Gemini-parsed resume data.
It is a monorepo with a FastAPI backend and a React frontend.

[Demo video](https://youtu.be/K7wjLY_iihg)

## What it does

| Area | What the code does |
|---|---|
| Resume parsing | Extracts text from PDF and DOCX uploads, then asks Gemini for structured skills, experience, education and projects |
| Matching | Scores a student against an internship as 45% skills, 25% experience, 10% semantic similarity, 10% education and 10% projects and certifications |
| Ranking | Lists a posting's candidates by score with filters, pagination and CSV or Excel export |
| Anonymized review | Redacts the student's name, email, phone and profile links from the resume PDF a company sees |
| Duplicate flags | Flags candidates who share a phone number, LinkedIn URL or GitHub URL |
| Email | Sends daily summaries to companies and bulk emails to selected candidates over SMTP |
| Admin | Manages users, recomputes embeddings and reindexes ChromaDB |

Every user has one of three roles, student, company or admin.

## Architecture

```
skill-sync-frontend/  React 19 + MUI, Create React App
  src/pages/          one file per screen
  src/components/     shared UI
  src/services/       API client, auth, apiConfig.js holds the backend URL

skill-sync-backend/   FastAPI on Python 3.12
  app/main.py         app, CORS and router registration
  app/routes/         HTTP endpoints, mounted under /api
  app/services/       parsing, matching, RAG engine, email, S3, anonymization
  app/models/         SQLAlchemy models
  app/utils/          JWT auth and the Gemini key manager
  scripts/            one-off migrations, data loaders and diagnostics
  tests/              pytest suite
```

A resume upload goes through these steps.

1. `POST /api/resume/upload` stores the file in S3, or in `app/public/resumes` when AWS keys are empty.
2. `parser_service` extracts the text and `resume_intelligence_service` asks Gemini for structured data.
3. `rag_engine` embeds the resume with `all-MiniLM-L6-v2` and stores the vector in ChromaDB.
4. `matching_engine` scores the resume against internships, and `/api/filter/rank-candidates/{id}` returns the ranked list.

The Gemini key manager holds up to ten keys, one per task plus three fallbacks.
When a key is rate limited or invalid, the manager marks it failed and tries the next key in that task's priority list.

PostgreSQL holds users, internships, resumes, applications and match scores.
ChromaDB holds the embeddings on local disk.

## Quick start with Docker

```bash
cp skill-sync-backend/.env.example skill-sync-backend/.env   # optional, add Gemini keys for AI features
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API docs | http://localhost:8000/api/docs |
| Health check | http://localhost:8000/api/healthcheck |

Compose starts PostgreSQL 16, the backend and the frontend.
The app starts without Gemini keys, but resume parsing and AI explanations fail until you add them.
CI builds these images and checks the health endpoint on every push.

## Local development

You need Python 3.11 to 3.13, [uv](https://docs.astral.sh/uv/), Node 20 and PostgreSQL.

### Backend

```bash
cd skill-sync-backend
uv sync
cp .env.example .env          # then set DATABASE_URL, SECRET_KEY and the Gemini keys
uv run uvicorn app.main:app --reload --port 8000
```

The backend creates its tables on startup.

### Frontend

```bash
cd skill-sync-frontend
npm ci
cp .env.example .env          # REACT_APP_API_BASE_URL, defaults to http://localhost:8000/api
npm start
```

The dev server runs on http://localhost:3000.

## Tests and checks

| Check | Command |
|---|---|
| Backend tests with coverage | `cd skill-sync-backend && uv run pytest --cov` |
| Backend lint | `uv run ruff check .` |
| Backend format | `uv run ruff format --check .` |
| Backend dependency audit | `uv export --frozen --no-dev -o req.txt && uv run pip-audit -r req.txt --disable-pip` |
| Frontend tests with coverage | `cd skill-sync-frontend && npm run test:coverage` |
| Frontend lint | `npm run lint` |
| Frontend build | `npm run build` |
| Frontend dependency audit | `npm audit --omit=dev --audit-level=high` |

Backend tests run against SQLite and need no running services.
`tests/conftest.py` pins `DATABASE_URL` to a local SQLite file, so a stray `.env` cannot point the suite at a real database.

GitHub Actions runs every check above on each push and pull request, plus a gitleaks scan and the Docker smoke test.
CI fails when backend coverage drops below 70% or frontend line coverage below 6%.

## Configuration

The backend reads its settings from environment variables, and `skill-sync-backend/.env.example` lists every one of them.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT signing for login tokens |
| `TEMP_TOKEN_SECRET` | Signing key for short-lived resume view links |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, empty allows all |
| `LOG_LEVEL`, `LOG_FORMAT` | Log level, and `json` for one JSON object per line |
| `FRONTEND_URL`, `BACKEND_URL` | Public URLs used in emails and resume links |
| `GEMINI_KEY_*` | Ten Gemini API keys, one per task plus three fallbacks |
| `CHROMA_DB_PATH` | ChromaDB directory |
| `AWS_*` | S3 resume storage, leave empty for local storage |
| `SMTP_*`, `SENDER_EMAIL`, `SENDER_NAME` | Outgoing email |

The frontend reads one variable, `REACT_APP_API_BASE_URL`, at build time.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Team

Zero Vector.
Contact heyitsgautham@gmail.com.
