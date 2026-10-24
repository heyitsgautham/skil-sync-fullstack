// Base URL for every backend call: the FastAPI origin plus the /api prefix its routers mount under.
// Set REACT_APP_API_BASE_URL at build time to point the app at another backend.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
