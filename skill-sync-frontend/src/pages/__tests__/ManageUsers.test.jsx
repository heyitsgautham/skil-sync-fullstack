import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageUsers from '../ManageUsers';
import { admin, fakeBackend, fail, signIn } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const USERS = [
    {
        id: 1,
        email: 'admin@skillsync.test',
        full_name: 'Site Admin',
        role: 'admin',
        is_active: 1,
        created_at: '2026-01-01',
    },
    {
        id: 2,
        email: 'hr@acme.test',
        full_name: 'Acme Labs',
        role: 'company',
        is_active: 1,
        anonymization_enabled: false,
        created_at: '2026-02-01',
    },
    {
        id: 3,
        email: 'asha@example.com',
        full_name: 'Asha Raman',
        role: 'student',
        is_active: 1,
        created_at: '2026-03-01',
    },
];

beforeEach(() => {
    localStorage.clear();
    signIn(admin);
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const rowFor = (name) => screen.getByText(name).closest('tr'); // eslint-disable-line testing-library/no-node-access

test('lists every user and filters them by search', async () => {
    fakeBackend([['get', '/auth/users', USERS]]);
    renderAt(<ManageUsers />, '/admin/users');

    expect(await screen.findByText('Asha Raman')).toBeInTheDocument();
    expect(screen.getByText('3 Users')).toBeInTheDocument();

    userEvent.paste(screen.getByPlaceholderText(/Search by name/), 'company');

    expect(screen.getByText('1 Users')).toBeInTheDocument();
    expect(screen.queryByText('Asha Raman')).not.toBeInTheDocument();
});

test('turning on anonymization for a company sends it with the update', async () => {
    const calls = fakeBackend([
        ['get', '/auth/users', USERS],
        ['put', '/auth/users/2', { ...USERS[1], anonymization_enabled: true }],
    ]);
    renderAt(<ManageUsers />, '/admin/users');
    await screen.findByText('Acme Labs');

    userEvent.click(within(rowFor('Acme Labs')).getByRole('button', { name: 'Edit User' }));
    const dialog = await screen.findByRole('dialog');
    userEvent.click(within(dialog).getByRole('switch'));
    userEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('User updated successfully')).toBeInTheDocument();
    const put = calls.find((c) => c.method === 'put');
    expect(put.body).toEqual({ full_name: 'Acme Labs', is_active: 1, anonymization_enabled: true });
});

test('renames a user', async () => {
    const calls = fakeBackend([
        ['get', '/auth/users', USERS],
        ['put', '/auth/users/3', { ...USERS[2], full_name: 'Asha R' }],
    ]);
    renderAt(<ManageUsers />, '/admin/users');
    await screen.findByText('Asha Raman');

    userEvent.click(within(rowFor('Asha Raman')).getByRole('button', { name: 'Edit User' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText(/Full Name/);
    userEvent.clear(name);
    userEvent.paste(name, 'Asha R');
    userEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('User updated successfully')).toBeInTheDocument();
    const put = calls.find((c) => c.method === 'put');
    // Anonymization only applies to companies, so a student's update leaves it out.
    expect(put.body).toEqual({ full_name: 'Asha R', is_active: 1 });
    expect(calls.filter((c) => c.path === '/auth/users')).toHaveLength(2);
});

test('shows the server message when an update fails', async () => {
    fakeBackend([
        ['get', '/auth/users', USERS],
        ['put', '/auth/users/2', fail(400, 'Role changes are not allowed')],
    ]);
    renderAt(<ManageUsers />, '/admin/users');
    await screen.findByText('hr@acme.test');

    userEvent.click(within(rowFor('hr@acme.test')).getByRole('button', { name: 'Edit User' }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Role changes are not allowed')).toBeInTheDocument();
});

test('deletes a user after confirming', async () => {
    const calls = fakeBackend([
        ['get', '/auth/users', USERS],
        ['delete', '/auth/users/2', { message: 'deleted' }],
    ]);
    renderAt(<ManageUsers />, '/admin/users');
    await screen.findByText('Acme Labs');

    // eslint-disable-next-line testing-library/no-node-access
    userEvent.click(within(rowFor('Acme Labs')).getByTestId('DeleteIcon').closest('button'));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Delete User/ }));

    expect(await screen.findByText('User deleted successfully')).toBeInTheDocument();
    await waitFor(() => expect(calls.some((c) => c.method === 'delete')).toBe(true));
});

test('explains a failed load', async () => {
    fakeBackend([['get', '/auth/users', fail(403, 'Only administrators can access user list')]]);
    renderAt(<ManageUsers />, '/admin/users');

    expect(
        await screen.findByText('Failed to load users. Please ensure you have admin privileges.'),
    ).toBeInTheDocument();
});
