import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from '../Login';
import authService from '../../services/authService';

vi.mock('../../services/authService', () => ({
    __esModule: true,
    default: { login: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: vi.fn(), error: vi.fn() },
}));

const renderLogin = () =>
    render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
            </Routes>
        </MemoryRouter>,
    );

const fillAndSubmit = () => {
    userEvent.paste(screen.getByLabelText(/Email Address/), 'student@example.com');
    userEvent.paste(screen.getByLabelText(/Password/), 'secret123');
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
};

describe('Login page', () => {
    beforeEach(() => vi.clearAllMocks());

    test('signs in and goes to the dashboard', async () => {
        authService.login.mockResolvedValue({ access_token: 'jwt' });
        renderLogin();

        fillAndSubmit();

        expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
        expect(authService.login).toHaveBeenCalledWith('student@example.com', 'secret123');
        expect(toast.success).toHaveBeenCalled();
    });

    test('shows the server error and stays on the page', async () => {
        authService.login.mockRejectedValue(new Error('Incorrect email or password'));
        renderLogin();

        fillAndSubmit();

        expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Incorrect email or password');
        expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    });

    test('clears the error once the user edits a field', async () => {
        authService.login.mockRejectedValue(new Error('Incorrect email or password'));
        renderLogin();
        fillAndSubmit();
        await screen.findByText('Incorrect email or password');

        userEvent.paste(screen.getByLabelText(/Password/), 'x');

        await waitFor(() => expect(screen.queryByText('Incorrect email or password')).not.toBeInTheDocument());
    });
});
