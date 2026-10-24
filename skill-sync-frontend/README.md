# SkillSync frontend

React 19 and MUI client for SkillSync, built with Create React App.
The [root README](../README.md) covers the architecture and Docker.

## Run it

You need Node 20 and a running backend.

```bash
npm ci
cp .env.example .env          # REACT_APP_API_BASE_URL, defaults to http://localhost:8000/api
npm start
```

The dev server runs on http://localhost:3000.
Every API call reads its base URL from `src/services/apiConfig.js`, which reads `REACT_APP_API_BASE_URL` at build time.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm run test:coverage` | Jest once with coverage, fails under the thresholds in `package.json` |
| `npm test` | Jest in watch mode |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run build` | Production bundle in `build/` |

## Layout

| Path | Contents |
|---|---|
| `src/App.js` | Routes, with `PrivateRoute` guarding the signed-in pages |
| `src/pages/` | One component per screen, with role-specific profiles under `admin/`, `company/` and `student/` |
| `src/components/` | Shared UI such as `Layout`, `CollapsibleSection` and the candidate modals |
| `src/services/` | `apiConfig.js`, the axios client in `api.js` and `authService.js` |
| `src/tests/`, `**/__tests__/` | Jest and Testing Library tests |
