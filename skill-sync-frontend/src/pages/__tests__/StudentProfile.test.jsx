import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProfile from '../student/StudentProfile';
import { fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const PROFILE = {
    id: 11,
    email: 'asha@example.com',
    full_name: 'Asha Raman',
    phone: '98765 43210',
    linkedin_url: 'https://linkedin.com/in/asha',
    github_url: null,
    role: 'student',
};

beforeEach(() => {
    localStorage.clear();
    signIn(student);
});

const field = (label) => screen.getByLabelText(label);

test('shows the profile read-only with the email locked', async () => {
    fakeBackend([['get', '/profile/me', PROFILE]]);
    renderAt(<StudentProfile />, '/student/profile');

    expect(await screen.findByDisplayValue('98765 43210')).toBeDisabled();
    expect(field('LinkedIn Profile URL')).toHaveValue('https://linkedin.com/in/asha');
    expect(field('GitHub Profile URL')).toHaveValue('');
    expect(field('Email')).toBeDisabled();

    userEvent.click(screen.getByRole('button', { name: /Edit Profile/ }));
    expect(field('Phone Number')).toBeEnabled();
    expect(field('Email')).toBeDisabled();
});

test('saves the four editable fields and updates the top bar name', async () => {
    const calls = fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['put', '/profile/me', ({ body }) => ({ ...PROFILE, ...body })],
    ]);
    renderAt(<StudentProfile />, '/student/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.clear(field('Full Name'));
    userEvent.paste(field('Full Name'), 'Asha R');
    userEvent.paste(field('GitHub Profile URL'), 'https://github.com/asha');
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'put').body).toEqual({
        full_name: 'Asha R',
        phone: '98765 43210',
        linkedin_url: 'https://linkedin.com/in/asha',
        github_url: 'https://github.com/asha',
    });
    expect(JSON.parse(localStorage.getItem('user')).full_name).toBe('Asha R');
});

test('cancel puts back the saved values without calling the API', async () => {
    const calls = fakeBackend([['get', '/profile/me', PROFILE]]);
    renderAt(<StudentProfile />, '/student/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.clear(field('Phone Number'));
    userEvent.paste(field('Phone Number'), '000');
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(field('Phone Number')).toHaveValue('98765 43210');
    expect(field('Phone Number')).toBeDisabled();
    expect(calls.filter((c) => c.method === 'put')).toHaveLength(0);
});

test('a failed load reports the error', async () => {
    fakeBackend([['get', '/profile/me', fail(500, 'Internal server error')]]);
    renderAt(<StudentProfile />, '/student/profile');

    expect(await screen.findByText('Error: Failed to fetch profile')).toBeInTheDocument();
});

test('a rejected save shows the reason the API gave and stays in edit mode', async () => {
    const invalid = {
        __error: true,
        status: 422,
        data: {
            detail: [
                {
                    loc: ['body', 'github_url'],
                    msg: 'Value error, GitHub URL cannot contain spaces',
                },
            ],
        },
    };
    fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['put', '/profile/me', invalid],
    ]);
    renderAt(<StudentProfile />, '/student/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.paste(field('GitHub Profile URL'), 'not a url');
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Error: GitHub URL cannot contain spaces')).toBeInTheDocument();
    expect(field('GitHub Profile URL')).toBeEnabled();
});
