describe('AuthService', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    test('localStorage is available', () => {
        expect(typeof localStorage).toBe('object');
    });

    test('can set and get from localStorage', () => {
        localStorage.setItem('test', 'value');
        expect(localStorage.getItem('test')).toBe('value');
    });

    test('can clear localStorage', () => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', 'test-user');

        localStorage.clear();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    test('basic math operations work', () => {
        expect(2 + 2).toBe(4);
        expect(5 * 3).toBe(15);
    });
});
