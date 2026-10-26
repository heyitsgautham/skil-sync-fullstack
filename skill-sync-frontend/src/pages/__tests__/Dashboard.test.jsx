import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { admin, company, fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const STATUS = { resumes: { total: 12, with_embeddings: 10 }, matches: { total: 40 } };

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const cardButton = (title) => {
    // eslint-disable-next-line testing-library/no-node-access
    const card = screen.getByRole('heading', { name: title }).closest('.MuiCard-root');
    return within(card).getByRole('button');
};

test('students see their resume and recommendation cards', async () => {
    signIn(student);
    fakeBackend([]);
    renderAt(<Dashboard />, '/dashboard');

    expect(screen.getByText('Welcome back, Asha Raman!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resume Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Recommendations' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Post Internship' })).not.toBeInTheDocument();

    userEvent.click(cardButton('AI Recommendations'));
    expect(screen.getByTestId('navigated-away')).toBeInTheDocument();
});

test('companies see posting and ranking cards', () => {
    signIn(company);
    const calls = fakeBackend([]);
    renderAt(<Dashboard />, '/dashboard');

    expect(screen.getByRole('heading', { name: 'Post Internship' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manage Listings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Candidate Ranking' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'User Management' })).not.toBeInTheDocument();
    expect(calls).toEqual([]);
});

test('admins load the system status and can recompute embeddings', async () => {
    signIn(admin);
    const calls = fakeBackend([
        ['get', '/admin/system-status', STATUS],
        [
            'post',
            '/admin/recompute-embeddings',
            {
                resumes: { cached: 8, recomputed: 4 },
                internships: { cached: 2, recomputed: 1 },
                matches: { recalculated: 30 },
            },
        ],
    ]);
    renderAt(<Dashboard />, '/dashboard');

    expect(screen.getByText('Welcome back, Admin!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
    await waitFor(() => expect(calls.map((c) => c.path)).toContain('/admin/system-status'));

    userEvent.click(screen.getByRole('button', { name: /Recompute Embeddings/ }));

    expect(await screen.findByText(/5 new embeddings generated/)).toBeInTheDocument();
    expect(screen.getByText(/Resumes: 8 cached, 4 recomputed/)).toBeInTheDocument();
    expect(screen.getByText(/Matches: 30 recalculated/)).toBeInTheDocument();
});

test('a failed recompute shows the reason the API gave', async () => {
    signIn(admin);
    fakeBackend([
        ['get', '/admin/system-status', STATUS],
        ['post', '/admin/recompute-embeddings', fail(500, 'Error recomputing embeddings')],
    ]);
    renderAt(<Dashboard />, '/dashboard');

    userEvent.click(screen.getByRole('button', { name: /Recompute Embeddings/ }));

    expect(await screen.findByText('Error recomputing embeddings. Please try again.')).toBeInTheDocument();
});

test('clearing ChromaDB asks first, then reports what it deleted', async () => {
    signIn(admin);
    const calls = fakeBackend([
        ['get', '/admin/system-status', STATUS],
        ['post', '/admin/clear-chromadb', { resumes_cleared: 12, matches_cleared: 40 }],
    ]);
    renderAt(<Dashboard />, '/dashboard');

    userEvent.click(screen.getByRole('button', { name: /Clear ChromaDB/ }));
    const dialog = await screen.findByRole('dialog');
    userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.map((c) => c.path)).not.toContain('/admin/clear-chromadb');

    userEvent.click(screen.getByRole('button', { name: /Clear ChromaDB/ }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Yes, Delete Everything/ }));

    expect(await screen.findByText(/12 embeddings and 40 matches deleted/)).toBeInTheDocument();
});

test('re-indexing with no resume files on disk says so', async () => {
    signIn(admin);
    fakeBackend([
        ['get', '/admin/system-status', STATUS],
        ['post', '/admin/reindex-all-students', fail(404, 'No resume files found in directory')],
    ]);
    renderAt(<Dashboard />, '/dashboard');

    userEvent.click(screen.getByRole('button', { name: /Re-index/ }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Start Re-indexing/ }));

    expect(await screen.findByText('No resume files found in directory. Please try again.')).toBeInTheDocument();
});

test('re-indexing starts, then refreshes the status 30 seconds later', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signIn(admin);
    const calls = fakeBackend([
        ['get', '/admin/system-status', STATUS],
        ['post', '/admin/reindex-all-students', { total_files: 7 }],
    ]);
    renderAt(<Dashboard />, '/dashboard');

    userEvent.click(screen.getByRole('button', { name: /Re-index/ }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Start Re-indexing/ }));
    expect(await screen.findByText(/Started reindexing 7 student resumes/)).toBeInTheDocument();

    const before = calls.filter((c) => c.path === '/admin/system-status').length;
    await act(async () => {
        vi.advanceTimersByTime(30000);
    });

    expect(await screen.findByText('Reindexing completed! System status updated.')).toBeInTheDocument();
    expect(calls.filter((c) => c.path === '/admin/system-status').length).toBe(before + 1);
});
