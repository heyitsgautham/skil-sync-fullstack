import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import IntelligentRanking from '../IntelligentRanking';
import { company, fakeBackend, fail, signIn, withHeaders } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');
vi.mock('react-hot-toast', () => {
    const toast = vi.fn();
    toast.success = vi.fn();
    toast.error = vi.fn();
    toast.loading = vi.fn();
    toast.dismiss = vi.fn();
    return { __esModule: true, default: toast, Toaster: () => null };
});

const POSTS = [
    { id: 1, internship_id: 'uuid-backend', title: 'Backend Intern', company_name: 'Acme Labs' },
    { id: 2, internship_id: 'uuid-frontend', title: 'Frontend Intern', company_name: 'Acme Labs' },
];

const candidate = (n, overrides = {}) => ({
    candidate_id: n,
    candidate_name: `Candidate Name ${n}`,
    student_id: n,
    student_name: `Candidate Name ${n}`,
    match_score: 95 - n * 5,
    component_scores: { semantic_similarity: 80, skills_match: 90, experience_match: 70 },
    match_details: {
        matched_required_skills: ['Python'],
        missing_required_skills: ['Docker'],
        matched_preferred_skills: [],
        missing_preferred_skills: [],
    },
    scoring_breakdown: { has_tailored: false },
    explanation: `Explanation for ${n}`,
    is_flagged: false,
    ...overrides,
});

const ranking = (candidates, extra = {}) => ({
    ranked_candidates: candidates,
    total_candidates: candidates.length,
    filters_applied: [],
    anonymization_enabled: false,
    ...extra,
});

beforeEach(() => {
    localStorage.clear();
    signIn(company);
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

async function rankFor(title) {
    const select = await screen.findByRole('combobox');
    await waitFor(() => expect(select).not.toHaveAttribute('aria-disabled', 'true'));
    userEvent.click(select);
    userEvent.click(await screen.findByRole('option', { name: new RegExp(title) }));
    userEvent.click(screen.getByRole('button', { name: /Rank Candidates/ }));
}

test('ranks the chosen internship and shows each candidate', async () => {
    const calls = fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        [
            'post',
            '/filter/rank-candidates/uuid-backend',
            ranking([candidate(1), candidate(2, { is_flagged: true, flag_reason_text: 'Same Mobile number' })]),
        ],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');

    await rankFor('Backend Intern');

    expect(await screen.findByText('Candidate Name 1')).toBeInTheDocument();
    expect(screen.getByText('Candidate Name 2')).toBeInTheDocument();
    expect(screen.getByText('90% Match')).toBeInTheDocument();
    expect(screen.getByText('Same Mobile number')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Ranked 2 candidates'));
    const rankCall = calls.find((c) => c.path.startsWith('/filter/rank-candidates'));
    expect(rankCall.url).toContain('limit=50');
});

test('anonymized companies see numbered candidates instead of names', async () => {
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking([candidate(1)], { anonymization_enabled: true })],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');

    await rankFor('Backend Intern');

    expect(await screen.findByText('Candidate #1')).toBeInTheDocument();
    expect(screen.queryByText('Candidate Name 1')).not.toBeInTheDocument();
});

test('pages through more than five candidates', async () => {
    const seven = [1, 2, 3, 4, 5, 6, 7].map((n) => candidate(n));
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking(seven)],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');

    await rankFor('Backend Intern');
    expect(await screen.findByText('Candidate Name 5')).toBeInTheDocument();
    expect(screen.queryByText('Candidate Name 6')).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Candidate Name 6')).toBeInTheDocument();
    expect(screen.queryByText('Candidate Name 1')).not.toBeInTheDocument();
});

test('a failed ranking shows the server error', async () => {
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', fail(403, 'Not authorized to view this internship')],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');

    await rankFor('Backend Intern');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Not authorized to view this internship'));
});

test('the rank button stays disabled until an internship is chosen', async () => {
    fakeBackend([['get', '/internship/my-posts', POSTS]]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');

    await screen.findByRole('combobox');

    expect(screen.getByRole('button', { name: /Rank Candidates/ })).toBeDisabled();
});

test('exports the ranking as CSV', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:export');
    window.URL.revokeObjectURL = vi.fn();
    const calls = fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking([candidate(1)])],
        ['get', '/filter/export-candidates/uuid-backend', 'a,b\n'],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');
    await rankFor('Backend Intern');
    await screen.findByText('Candidate Name 1');

    // The export button shows only an icon, so the test reaches it through that icon.
    // eslint-disable-next-line testing-library/no-node-access
    userEvent.click(screen.getByTestId('FileDownloadIcon').closest('button'));
    userEvent.click(await screen.findByRole('menuitem', { name: /CSV/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('✅ Exported 1 candidates to CSV'));
    expect(calls.find((c) => c.path.startsWith('/filter/export')).params).toEqual({
        format: 'csv',
        export_type: 'filtered',
        only_applicants: false,
    });
});

test('opens a candidate resume stored in S3', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', '/recommendations/resume/1', { storage_type: 's3', url: 'https://bucket/cv.pdf', anonymized: false }],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking([candidate(1)])],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');
    await rankFor('Backend Intern');
    await screen.findByText('Candidate Name 1');

    userEvent.click(screen.getByRole('button', { name: /Resume/ }));

    await waitFor(() => expect(open).toHaveBeenCalledWith('https://bucket/cv.pdf', '_blank'));
});

test('opens a resume served by the API with the type the server sent', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    window.URL.createObjectURL = vi.fn(() => 'blob:resume');
    window.URL.revokeObjectURL = vi.fn();
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        [
            'get',
            '/recommendations/resume/1',
            {
                storage_type: 'api',
                url: 'http://localhost:8000/api/resumes/5/view?token=t',
                anonymized: false,
            },
        ],
        ['get', '/resumes/5/view', withHeaders('Plain text resume', { 'content-type': 'text/plain; charset=utf-8' })],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking([candidate(1)])],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');
    await rankFor('Backend Intern');
    await screen.findByText('Candidate Name 1');

    userEvent.click(screen.getByRole('button', { name: /Resume/ }));

    await waitFor(() => expect(open).toHaveBeenCalledWith('blob:resume', '_blank'));
    const [blob] = window.URL.createObjectURL.mock.calls[0];
    expect(blob.type).toBe('text/plain; charset=utf-8');
});

test('email selection mode needs at least one candidate', async () => {
    fakeBackend([
        ['get', '/internship/my-posts', POSTS],
        ['get', /^\/internship\/\w+/, POSTS[0]],
        ['post', '/filter/rank-candidates/uuid-backend', ranking([candidate(1), candidate(2)])],
    ]);
    renderAt(<IntelligentRanking />, '/intelligent-ranking');
    await rankFor('Backend Intern');
    await screen.findByText('Candidate Name 1');

    const filterCheckboxes = screen.queryAllByRole('checkbox');
    userEvent.click(screen.getByRole('button', { name: 'Send Clustered Email' }));
    expect(toast.success).toHaveBeenCalledWith('Selection mode enabled. Select candidates to send emails.');

    userEvent.click(screen.getByRole('button', { name: 'Send Email (0 selected)' }));
    expect(toast.error).toHaveBeenCalledWith('Please select at least one candidate');

    // Selection mode adds a select-all box, then one box per candidate.
    const [selectAll, ...candidateBoxes] = screen
        .getAllByRole('checkbox')
        .filter((box) => !filterCheckboxes.includes(box));
    expect(candidateBoxes).toHaveLength(2);
    userEvent.click(candidateBoxes[0]);
    expect(screen.getByRole('button', { name: 'Send Email (1 selected)' })).toBeInTheDocument();
    userEvent.click(selectAll);
    expect(screen.getByRole('button', { name: 'Send Email (2 selected)' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(screen.getByRole('button', { name: 'Send Clustered Email' })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(filterCheckboxes.length);
});
