# SkillSync frontend

React 19 and MUI client for SkillSync, built with Vite and tested with Vitest.
The [root README](../README.md) covers the architecture and Docker.

## Run it

You need Node 22.12 or newer and a running backend.

This package is a workspace of the root `package.json`, so install from the repository root.

```bash
cd .. && npm ci && cd skill-sync-frontend
cp .env.example .env          # VITE_API_BASE_URL, defaults to http://localhost:8000/api
npm start
```

The dev server runs on http://localhost:3000.
Every API call reads its base URL from `src/services/apiConfig.js`, which reads `VITE_API_BASE_URL` at build time.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm run test:coverage` | Vitest once with coverage, fails under the thresholds in `vite.config.js` |
| `npm test` | Vitest in watch mode |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run build` | Production bundle in `build/` |
| `npm run preview` | Serves the production bundle on port 3000 |

## Layout

| Path | Contents |
|---|---|
| `src/App.jsx` | Routes, with `PrivateRoute` guarding the signed-in pages |
| `src/pages/` | One component per screen, with role-specific profiles under `admin/`, `company/` and `student/` |
| `src/pages/dashboard/`, `ranking/`, `resumeIntelligence/` | The hook and sections behind the three largest pages |
| `src/testUtils/` | The fake backend and router helpers the page tests share |
| `src/components/` | Shared UI such as `Layout`, `CollapsibleSection` and the candidate modals |
| `src/services/` | `apiConfig.js`, the axios client in `api.js` and `authService.js` |
| `src/tests/`, `**/__tests__/` | Vitest and Testing Library tests |
