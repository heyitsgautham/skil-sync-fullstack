import apiClient from '../api';
import { API_BASE_URL } from '../apiConfig';

const requestInterceptor = () => apiClient.interceptors.request.handlers[0];
const responseInterceptor = () => apiClient.interceptors.response.handlers[0];

describe('apiClient', () => {
    let originalLocation;

    beforeEach(() => {
        localStorage.clear();
        originalLocation = window.location;
        delete window.location;
        window.location = { href: '/dashboard' };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    test('targets the configured backend', () => {
        expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
    });

    test('adds the bearer token when one is stored', () => {
        localStorage.setItem('token', 'jwt-abc');
        const config = requestInterceptor().fulfilled({ headers: {} });
        expect(config.headers.Authorization).toBe('Bearer jwt-abc');
    });

    test('sends no Authorization header without a token', () => {
        const config = requestInterceptor().fulfilled({ headers: {} });
        expect(config.headers.Authorization).toBeUndefined();
    });

    test('a 401 clears the session and redirects to /login', async () => {
        localStorage.setItem('token', 'expired');
        localStorage.setItem('user', '{}');
        const error = { response: { status: 401 } };

        await expect(responseInterceptor().rejected(error)).rejects.toBe(error);
        expect(localStorage.getItem('token')).toBeNull();
        expect(window.location.href).toBe('/login');
    });

    test('other errors pass through without touching the session', async () => {
        localStorage.setItem('token', 'still-valid');
        const error = { response: { status: 500 } };

        await expect(responseInterceptor().rejected(error)).rejects.toBe(error);
        expect(localStorage.getItem('token')).toBe('still-valid');
        expect(window.location.href).toBe('/dashboard');
    });
});
