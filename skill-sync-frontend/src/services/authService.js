import apiClient from './api';

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.full_name - User's full name
     * @param {string} userData.role - User role (student, company, admin)
     * @returns {Promise} Registration response
     */
    async register(userData) {
        try {
            const response = await apiClient.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login response with token
     */
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            const { access_token, user } = response.data;

            // Store token and user info in localStorage
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    /**
     * Get current user from localStorage
     * @returns {Object|null} User object or null
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user has valid token
     */
    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    /**
     * Get auth token
     * @returns {string|null} Token or null
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Handle API errors
     * @param {Error} error - Error object
     * @returns {string} Error message
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
            return new Error(message);
        } else if (error.request) {
            // Request made but no response
            return new Error('No response from server. Please check your connection.');
        } else {
            // Something else happened
            return new Error(error.message || 'An unexpected error occurred');
        }
    }
}

const authService = new AuthService();
export default authService;
