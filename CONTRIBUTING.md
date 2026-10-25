# Contributing

## Setup

Follow "Local development" in the [README](README.md) to install the backend with uv and the frontend with npm.
`docker compose up --build` gives you the whole stack when you only need to click through the app.

## Before you open a pull request

Run the same checks CI runs.

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest --cov

cd skill-sync-frontend
npm run lint
npm run test:coverage
npm run build
```

CI also runs pip-audit, npm audit, a gitleaks scan of the tree and a Docker Compose smoke test.
A pull request merges only with every job green.

## Commits

Each commit makes one change and carries the tests that prove it.
Keep formatting, refactors and behavior changes in separate commits.

Write subjects as `type(scope): summary` in the imperative, for example `fix(auth): reject expired tokens`.
The types in use are `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `perf` and `style`.

## Tests

Backend tests live in `skill-sync-backend/tests/` and run against SQLite.
Use the `client`, `make_user` and `auth_headers` fixtures from `tests/conftest.py` to call endpoints as a given role.
Mock Gemini, S3 and SMTP, and never call a paid API from a test.

Frontend tests sit next to the code in `__tests__/` folders or in `src/tests/`.
Query by role or label with Testing Library, and mock axios at the module boundary.

Coverage floors in the root `pyproject.toml` and in `skill-sync-frontend/vite.config.js` only go up.
Raise them in the same pull request that adds the tests.

## Secrets

Never commit `.env` files, API keys or real resumes.
Put new settings in the matching `.env.example` with a placeholder value.
If you find a committed secret, tell the maintainers so they can rotate it.

## Style

Python follows the ruff config in the root `pyproject.toml`, with 120-character lines.
JavaScript follows `skill-sync-frontend/eslint.config.js`, and lint allows zero warnings.
Backend code logs through `logging.getLogger(__name__)` rather than `print`.
