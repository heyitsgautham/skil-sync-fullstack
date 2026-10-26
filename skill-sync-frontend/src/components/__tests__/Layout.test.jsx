import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Layout from '../Layout';
import { admin, company, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

beforeEach(() => localStorage.clear());

test('the main area can shrink below its widest child, so phones do not scroll sideways', () => {
    signIn(student);
    renderAt(
        <Layout>
            <p>Page body</p>
        </Layout>,
        '/dashboard',
    );

    expect(screen.getByRole('main')).toHaveStyle({ minWidth: '0' });
});

const renderLayout = (path = '/dashboard') =>
    renderAt(
        <Layout>
            <p>Page body</p>
        </Layout>,
        path,
    );

const sidebarItems = () =>
    within(screen.getByRole('navigation'))
        .getAllByRole('button')
        .map((button) => button.textContent);

test.each([
    {
        user: student,
        items: [
            'Dashboard',
            'AI Resume Intelligence',
            'AI Recommendations',
            'Browse Internships',
            'My Applications',
            'My Profile',
        ],
    },
    { user: company, items: ['Dashboard', 'My Internships', 'AI Candidate Ranking', 'My Profile'] },
    { user: admin, items: ['Dashboard', 'User Management', 'All Internships', 'Analytics', 'My Profile'] },
])("the $user.role menu lists only that role's pages", ({ user, items }) => {
    signIn(user);
    renderLayout();

    expect(sidebarItems()).toEqual(items);
});

test('the top bar names the current page, and falls back to SkillSync for pages outside the menu', () => {
    signIn(company);
    const { unmount } = renderLayout('/intelligent-ranking');
    expect(within(screen.getByRole('banner')).getByText('AI Candidate Ranking')).toBeInTheDocument();
    unmount();

    renderLayout('/internships/create');
    expect(within(screen.getByRole('banner')).getByText('SkillSync')).toBeInTheDocument();
});

test('choosing a menu item navigates to its page', () => {
    signIn(admin);
    renderLayout();

    userEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: 'Analytics' }));

    expect(screen.getByTestId('navigated-away')).toBeInTheDocument();
});

test('the account menu shows who is signed in and logs them out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    signIn(student);
    renderLayout();

    userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Account menu' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('asha@example.com')).toBeInTheDocument();

    userEvent.click(within(menu).getByRole('menuitem', { name: 'Logout' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    vi.restoreAllMocks();
});

test('clicking the brand collapses the sidebar and remembers it', () => {
    signIn(student);
    const { unmount } = renderLayout();
    expect(localStorage.getItem('sidebarCollapsed')).toBeNull();

    userEvent.click(within(screen.getByRole('navigation')).getByText('SkillSync'));
    expect(localStorage.getItem('sidebarCollapsed')).toBe('true');
    unmount();

    // A new page starts collapsed, and a second click expands it again
    renderLayout();
    userEvent.click(within(screen.getByRole('navigation')).getByText('SkillSync'));
    expect(localStorage.getItem('sidebarCollapsed')).toBe('false');
});
