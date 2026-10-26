# Security

## Reporting a vulnerability

Email heyitsgautham@gmail.com with the steps to reproduce.
Please do not open a public issue for a vulnerability.

## What SkillSync protects

SkillSync stores resumes and the contact details in them: names, emails, phone numbers and profile links.
Companies see that data for students who match their internships, and admins manage every account.
The controls below are what the code enforces today.

| Area | What the code does |
|---|---|
| Accounts | Passwords are hashed with bcrypt. Logins return a JWT signed with `SECRET_KEY` that expires after `ACCESS_TOKEN_EXPIRE_MINUTES`, 30 by default |
| Signing keys | An unset `SECRET_KEY` or `TEMP_TOKEN_SECRET`, or one still set to a placeholder from this repository, is replaced by a random key for that process, so no token can be signed with a published string |
| Roles | Every account is a student, company or admin, and the routes check the role from the database, not from the token |
| Admin accounts | Public sign-up creates students and companies only. An admin account needs an existing admin's token or the seed script |
| Resume links | Links that open a resume without a session carry a token signed with `TEMP_TOKEN_SECRET` that expires after one hour |
| Anonymized review | A company with anonymization on sees resumes with the name, email, phone and profile links redacted |
| Input | Request bodies are pydantic models with typed fields, email checks and lengths that match the database columns |
| Errors | A 500 response names what failed, never the exception text, and its X-Request-ID header carries the request ID. The traceback goes to the server log under that ID |
| CORS | `ALLOWED_ORIGINS` lists the origins that may call the API |
| Error tracking | Sentry runs only when `SENTRY_DSN` is set, and never sends request bodies, cookies or IP addresses |

## Checks in CI

Every push runs gitleaks over the tree, pip-audit over the backend's locked dependencies and npm audit over the frontend's production dependencies.
CI fails on any pip-audit finding except the four ChromaDB advisories below, and on any npm advisory rated high or critical.

## Accepted advisories

ChromaDB 1.5.9 is the newest release, and it has no fix for PYSEC-2026-311, PYSEC-2026-3813, PYSEC-2026-3814 and PYSEC-2026-3815.
Each one is reached through ChromaDB's own HTTP server, through its collection endpoints or its multi-tenant authorization.
SkillSync runs ChromaDB embedded in the backend process through `PersistentClient` and never starts or calls a ChromaDB server.
`skill-sync-backend/tests/test_vector_store_embedded.py` fails if any code uses a ChromaDB server client or if `docker-compose.yml` adds a ChromaDB service, so the exception cannot outlive its reason.
Remove the `--ignore-vuln` flags in `.github/workflows/ci.yml` once ChromaDB ships a fix.

## Secrets

Keys and credentials come from environment variables, and `skill-sync-backend/.env.example` lists each one with an empty value or a placeholder.
`.env` files are gitignored, as are uploaded resumes, the ChromaDB directory and generated exports.
Tests blank every third-party key before the app loads, so the suite never reaches Gemini, AWS, SMTP or Sentry.
