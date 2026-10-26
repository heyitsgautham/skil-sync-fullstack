import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Create axios instance with default configuration
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include token in headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // A 401 from the login form means a wrong email or password, which the form reports itself.
        // Reloading /login there would wipe the form and the message before anyone could read them.
        const isLoginAttempt = error.config?.url === '/auth/login';
        if (error.response?.status === 401 && !isLoginAttempt) {
            // Clear token and redirect to login on unauthorized
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export default apiClient;
