

Day 3 — Frontend Setup + Auth Integration

Goal: Start the frontend and connect it with existing backend auth & health routes.

Tasks:

🧩 Frontend Repo Setup

Create a new repo: skillsync-frontend

Initialize with:

npx create-react-app skillsync-frontend
# or
npx create-next-app@latest skillsync-frontend


Install dependencies:

npm install axios react-router-dom
npm install @mui/material @emotion/react @emotion/styled


(or Tailwind if you prefer Tailwind styling)

🧠 Connect Backend Auth

Create .env with:

REACT_APP_API_BASE_URL=https://skillsync-backend.vercel.app


Build pages:

/login

/register

/dashboard (dummy for now)

Implement login/register form → send POST requests to /auth/login and /auth/register.

Handle JWT token storage in localStorage.

✅ Deliverable:

Functional login & register connected to backend.

Verified API integration (CORS, token flow).
