import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import Register from '../Register';
import authService from '../../services/authService';

vi.mock('../../services/authService', () => ({
    __esModule: true,
    default: { register: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: vi.fn(), error: vi.fn() },
}));

const renderRegister = () =>
    render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>,
    );

const fill = ({
    name = 'Asha Raman',
    email = 'asha@example.com',
    password = 'secret-123',
    confirm = password,
} = {}) => {
    userEvent.paste(screen.getByLabelText(/Full Name/), name);
    userEvent.paste(screen.getByLabelText(/Email Address/), email);
    userEvent.paste(screen.getByLabelText(/^Password/), password);
    userEvent.paste(screen.getByLabelText(/Confirm Password/), confirm);
};

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

beforeEach(() => {
    vi.clearAllMocks();
});

test('offers the student and company roles only', () => {
    renderRegister();

    userEvent.click(screen.getByRole('combobox'));

    const options = within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((option) => option.textContent);
    expect(options).toEqual(['Student', 'Company']);
});

test('signs up as a student and moves to the login page', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    authService.register.mockResolvedValue({ message: 'User registered successfully with email: asha@example.com' });
    renderRegister();

    fill();
    submit();

    expect(await screen.findByText(/User registered successfully/)).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
        full_name: 'Asha Raman',
        email: 'asha@example.com',
        password: 'secret-123',
        role: 'student',
    });
    expect(toast.success).toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    vi.useRealTimers();
});

test('signs up as a company when that role is chosen', async () => {
    authService.register.mockResolvedValue({ message: 'ok' });
    renderRegister();

    fill({ name: 'Acme Labs', email: 'hr@acme.test' });
    userEvent.click(screen.getByRole('combobox'));
    userEvent.click(screen.getByRole('option', { name: 'Company' }));
    submit();

    await screen.findByText('ok');
    expect(authService.register.mock.calls[0][0].role).toBe('company');
});

test.each([
    [{ password: 'short', confirm: 'short' }, 'Password must be at least 8 characters long'],
    [{ confirm: 'different-123' }, 'Passwords do not match'],
    [{ name: 'A' }, 'Full name must be at least 2 characters long'],
])('stops before calling the API when the form is invalid', async (values, message) => {
    renderRegister();

    fill(values);
    submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
});

test('shows the server error and stays on the page', async () => {
    authService.register.mockRejectedValue(new Error('Email already registered'));
    renderRegister();

    fill();
    submit();

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Email already registered');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
});
