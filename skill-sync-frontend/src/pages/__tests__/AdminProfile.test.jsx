import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminProfile from '../admin/AdminProfile';
import { admin, fakeBackend, fail, signIn } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const PROFILE = { id: 1, email: 'admin@skillsync.test', full_name: 'Site Admin', role: 'admin' };

beforeEach(() => {
    localStorage.clear();
    signIn(admin);
});

test('renames the admin and shows the new name in the top bar', async () => {
    const calls = fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['put', '/profile/me', ({ body }) => ({ ...PROFILE, ...body })],
    ]);
    renderAt(<AdminProfile />, '/admin/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    expect(screen.getByLabelText('Email')).toBeDisabled();
    userEvent.clear(screen.getByLabelText('Full Name'));
    userEvent.paste(screen.getByLabelText('Full Name'), 'Head Admin');
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'put').body).toEqual({ full_name: 'Head Admin' });
    expect(screen.getAllByText('Head Admin').length).toBeGreaterThanOrEqual(2);
});

test('a rejected save keeps the form open', async () => {
    fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['put', '/profile/me', fail(422, 'String should have at most 255 characters')],
    ]);
    renderAt(<AdminProfile />, '/admin/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Error: Failed to update profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeEnabled();
});
