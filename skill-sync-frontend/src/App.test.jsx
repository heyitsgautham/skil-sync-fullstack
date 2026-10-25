import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('sends a signed-out visitor from / to the login page', async () => {
        window.history.pushState({}, '', '/');
        render(<App />);
        expect(await screen.findByLabelText(/Email Address/)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/login');
    });

    test('redirects a signed-out visitor away from a protected page', async () => {
        window.history.pushState({}, '', '/dashboard');
        render(<App />);
        expect(await screen.findByLabelText(/Email Address/)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/login');
    });

    test('serves the register page without a token', async () => {
        window.history.pushState({}, '', '/register');
        render(<App />);
        expect(await screen.findByLabelText(/Email Address/)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/register');
    });
});
