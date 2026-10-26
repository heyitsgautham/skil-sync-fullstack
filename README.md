# SkillSync

[![CI](https://github.com/heyitsgautham/skil-sync-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/heyitsgautham/skil-sync-fullstack/actions/workflows/ci.yml)

SkillSync is a full-stack web application that matches students to internships.
Students upload resumes, companies post internships, and the backend ranks candidates for each posting with embeddings plus Gemini-parsed resume data.
It is a monorepo with a FastAPI backend and a React frontend, and Docker Compose runs both with PostgreSQL.

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
skill-sync-frontend/  React 19 + MUI, built with Vite
  src/pages/          one file per screen, the largest split into a hook and section components
  src/components/     shared UI
  src/services/       API client, auth, apiConfig.js holds the backend URL

skill-sync-backend/   FastAPI on Python 3.12
  app/main.py         app, CORS and router registration
  app/routes/         HTTP endpoints, mounted under /api, with /api/filter in its own package
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

### Observability

The backend logs through structlog, as plain text or as one JSON object per line with `LOG_FORMAT=json`.
Every request gets an ID from its `X-Request-ID` header or a new one, which the response returns and every log line of that request carries.
Each request also writes one `app.access` line with its method, path, status and duration.
An exception no route handles is logged with its traceback and answered with a JSON 500 that names the request ID.
`/api/metrics` serves request counts and latencies per route template in the Prometheus text format.
Setting `SENTRY_DSN` also reports unhandled errors to Sentry, without request bodies, cookies or IPs.

PostgreSQL holds users, internships, resumes, applications and match scores.
ChromaDB holds the embeddings on local disk.

## Quick start with Docker

```bash
cp skill-sync-backend/.env.example skill-sync-backend/.env   # optional, add Gemini keys for AI features
make up                                                      # docker compose up --build, then checks /api/healthcheck
SEED_PASSWORD='choose-one' make seed                         # optional demo accounts, internships and resumes
```

`make seed` creates an admin, 3 companies with 3 internships each and 53 students, all with `SEED_PASSWORD`, or a random password it prints when that is unset.
The logins include `admin@skillsync.com`, `hr@techcorp.com` and `aarav.sharma@student.com`.
`make help` lists the other targets: `install`, `test`, `lint`, `build`, `dev-api`, `dev-web`, `down` and `logs`.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API docs | http://localhost:8000/api/docs |
| Health check | http://localhost:8000/api/healthcheck, 503 when the database is down |
| Prometheus metrics | http://localhost:8000/api/metrics |

Compose starts PostgreSQL 16, the backend and the frontend.
The root `Dockerfile` builds both images, as its `backend` and `frontend` targets.
The app starts without Gemini keys, but resume parsing and AI explanations fail until you add them.
CI builds these images and checks the health endpoint on every push.

## Local development

You need Python 3.11 to 3.13, [uv](https://docs.astral.sh/uv/), Node 22.12 or newer and PostgreSQL.

### Backend

The repository root is a uv workspace, so install from there.

```bash
uv sync                       # backend dependencies plus pytest, ruff and pip-audit, in ./.venv
cd skill-sync-backend
cp .env.example .env          # then set DATABASE_URL, SECRET_KEY and the Gemini keys
uv run uvicorn app.main:app --reload --port 8000
```

The backend creates its tables on startup.

### Frontend

The repository root is also an npm workspace, so `npm ci` there installs the frontend.

```bash
npm ci
cp skill-sync-frontend/.env.example skill-sync-frontend/.env   # VITE_API_BASE_URL, defaults to http://localhost:8000/api
npm run dev
```

The dev server runs on http://localhost:3000.

## Tests and checks

Run every check from the repository root.
`npm test` runs both suites, and `npm run lint` runs both linters.

| Check | Command |
|---|---|
| Backend tests with coverage | `uv run pytest --cov`, or `npm run test:py` |
| Backend lint and format | `npm run lint:py` |
| Backend dependency audit | `uv export --frozen --no-dev -o req.txt && uv run pip-audit -r req.txt --disable-pip` |
| Frontend tests with coverage | `npm run test:js` |
| Frontend lint | `npm run lint:js` |
| Frontend build | `npm run build` |
| Frontend dependency audit | `npm audit --omit=dev --audit-level=high` |

Backend tests run against SQLite and need no running services.
Set `TEST_DATABASE_URL` to a Postgres URL to run the same suite there, as the `Backend tests on Postgres` CI job does.
`skill-sync-backend/tests/conftest.py` pins `DATABASE_URL` to a local SQLite file, so a stray `.env` cannot point the suite at a real database.

GitHub Actions runs every check above on each push and pull request, plus a gitleaks scan and the Docker smoke test.
CI fails when backend coverage drops below 80% or frontend line coverage below 75%.

## Configuration

The backend reads its settings from environment variables, and `skill-sync-backend/.env.example` lists every one of them.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT signing for login tokens |
| `TEMP_TOKEN_SECRET` | Signing key for short-lived resume view links |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, empty allows all |
| `LOG_LEVEL`, `LOG_FORMAT` | Log level, and `json` for one JSON object per line |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | Optional Sentry error tracking, off when the DSN is empty |
| `FRONTEND_URL`, `BACKEND_URL` | Public URLs used in emails and resume links |
| `GEMINI_KEY_*` | Ten Gemini API keys, one per task plus three fallbacks |
| `CHROMA_DB_PATH` | ChromaDB directory |
| `AWS_*` | S3 resume storage, leave empty for local storage |
| `SMTP_*`, `SENDER_EMAIL`, `SENDER_NAME` | Outgoing email |

Set `SECRET_KEY` and `TEMP_TOKEN_SECRET` to the output of `openssl rand -hex 32`.
When either is unset or still a placeholder from this repository, the backend signs with a random key and logs a warning, so sessions and resume links end when it restarts.

The frontend reads one variable, `VITE_API_BASE_URL`, at build time.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
Report vulnerabilities as [SECURITY.md](SECURITY.md) describes.

## Team

Zero Vector.
Contact heyitsgautham@gmail.com.
