import apiClient from '../api';
import authService from '../authService';

vi.mock('../api', () => ({
    __esModule: true,
    default: { post: vi.fn() },
}));

describe('authService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    test('login posts the credentials and stores the token and user', async () => {
        const user = { id: 7, email: 'a@example.com', role: 'student' };
        apiClient.post.mockResolvedValue({ data: { access_token: 'jwt-123', user } });

        const data = await authService.login('a@example.com', 'secret');

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@example.com', password: 'secret' });
        expect(data.access_token).toBe('jwt-123');
        expect(localStorage.getItem('token')).toBe('jwt-123');
        expect(authService.getCurrentUser()).toEqual(user);
        expect(authService.isAuthenticated()).toBe(true);
    });

    test('login surfaces the server detail message and stores nothing', async () => {
        apiClient.post.mockRejectedValue({ response: { data: { detail: 'Incorrect email or password' } } });

        await expect(authService.login('a@example.com', 'wrong')).rejects.toThrow('Incorrect email or password');
        expect(localStorage.getItem('token')).toBeNull();
    });

    test('register returns the response body', async () => {
        apiClient.post.mockResolvedValue({ data: { message: 'User registered successfully' } });
        const payload = { email: 'b@example.com', password: 'pw', full_name: 'B', role: 'company' };

        await expect(authService.register(payload)).resolves.toEqual({ message: 'User registered successfully' });
        expect(apiClient.post).toHaveBeenCalledWith('/auth/register', payload);
    });

    test('getCurrentUser returns null for missing or corrupt data', () => {
        expect(authService.getCurrentUser()).toBeNull();
        localStorage.setItem('user', '{not json');
        expect(authService.getCurrentUser()).toBeNull();
    });

    test('handleError explains each failure mode', () => {
        expect(authService.handleError({ response: { data: { message: 'Bad input' } } }).message).toBe('Bad input');
        expect(authService.handleError({ response: { data: {} } }).message).toBe('An error occurred');
        expect(authService.handleError({ request: {} }).message).toMatch(/No response from server/);
        expect(authService.handleError(new Error('boom')).message).toBe('boom');
    });

    test('logout clears the session and sends the user to /login', () => {
        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '/dashboard' };
        localStorage.setItem('token', 'jwt');
        localStorage.setItem('user', '{}');

        authService.logout();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(window.location.href).toBe('/login');
        window.location = originalLocation;
    });
});
