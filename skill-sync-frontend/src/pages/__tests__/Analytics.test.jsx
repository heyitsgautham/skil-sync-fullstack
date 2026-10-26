import { screen } from '@testing-library/react';
import Analytics from '../Analytics';
import { admin, fakeBackend, fail, signIn } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const COUNTS = {
    total_users: 57,
    total_students: 53,
    total_companies: 3,
    total_admins: 1,
    total_internships: 9,
    active_internships: 8,
    total_resumes: 53,
};

beforeEach(() => {
    localStorage.clear();
    signIn(admin);
});

test('shows the system counts and the real average match score', async () => {
    fakeBackend([['get', '/auth/analytics', { ...COUNTS, average_match_score: 62.4 }]]);
    renderAt(<Analytics />, '/admin/analytics');

    expect(await screen.findAllByText('62.4%')).toHaveLength(2);
    expect(screen.getByText('57')).toBeInTheDocument();
    expect(screen.getByText('Resumes Uploaded')).toBeInTheDocument();
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
});

test('says so when no matches exist yet instead of showing a number', async () => {
    fakeBackend([['get', '/auth/analytics', { ...COUNTS, average_match_score: null }]]);
    renderAt(<Analytics />, '/admin/analytics');

    expect(await screen.findByText('No student-internship matches computed yet')).toBeInTheDocument();
    expect(screen.getAllByText('N/A')).toHaveLength(2);
});

test('shows the server error when analytics fail to load', async () => {
    fakeBackend([['get', '/auth/analytics', fail(403, 'Only administrators can access analytics')]]);
    renderAt(<Analytics />, '/admin/analytics');

    expect(await screen.findByText('Only administrators can access analytics')).toBeInTheDocument();
});
