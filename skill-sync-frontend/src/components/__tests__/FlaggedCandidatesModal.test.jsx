import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import FlaggedCandidatesModal from '../FlaggedCandidatesModal';
import { company, fakeBackend, fail, signIn } from '../../testUtils/backend';

vi.mock('../../services/api');
vi.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: vi.fn(), error: vi.fn() },
}));

const CANDIDATES = [
    {
        candidate_id: 1,
        candidate_name: 'Asha Raman',
        email: 'asha@example.com',
        phone: '98765 43210',
        linkedin_url: 'linkedin.com/in/asha',
        github_url: 'https://github.com/asha',
    },
    {
        candidate_id: 2,
        candidate_name: 'Ravi Kumar',
        email: 'ravi@example.com',
        phone: '98765 43210',
        linkedin_url: null,
        github_url: 'https://github.com/asha',
    },
    {
        candidate_id: 3,
        candidate_name: 'Meera Iyer',
        email: 'meera@example.com',
        phone: null,
        linkedin_url: null,
        github_url: 'https://github.com/asha',
    },
];

const renderModal = (props = {}) =>
    render(
        <FlaggedCandidatesModal
            open
            onClose={vi.fn()}
            candidateId={1}
            flaggedWith={{ same_mobile: [2], same_github: [2, 3] }}
            flagReasons={['same_mobile', 'same_github']}
            {...props}
        />,
    );

beforeEach(() => {
    localStorage.clear();
    signIn(company);
    vi.clearAllMocks();
});

test('asks for the current candidate and everyone flagged with them, once each', async () => {
    const calls = fakeBackend([['get', '/filter/flagged-candidates-details', { candidates: CANDIDATES }]]);
    renderModal();

    await screen.findByText('Same Mobile Number');
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual({ candidate_ids: '1,2,3' });
});

test('groups the matches by shared detail and marks the current candidate', async () => {
    fakeBackend([['get', '/filter/flagged-candidates-details', { candidates: CANDIDATES }]]);
    renderModal();

    const [mobile, github] = await screen.findAllByRole('table');
    expect(within(mobile).getAllByRole('row')).toHaveLength(3);
    expect(within(github).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('2 candidates')).toBeInTheDocument();
    expect(screen.getByText('3 candidates')).toBeInTheDocument();
    expect(within(mobile).getAllByText('Current')).toHaveLength(1);
});

test('links profiles with a protocol and shows N/A for missing details', async () => {
    fakeBackend([['get', '/filter/flagged-candidates-details', { candidates: CANDIDATES }]]);
    renderModal();

    const [mobile] = await screen.findAllByRole('table');
    const linkedIn = within(mobile).getAllByRole('link', { name: /View Profile/ })[0];
    expect(linkedIn).toHaveAttribute('href', 'https://linkedin.com/in/asha');
    expect(linkedIn).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(mobile).getAllByText('N/A').length).toBeGreaterThan(0);
});

test('does not load anything while closed', () => {
    const calls = fakeBackend([['get', '/filter/flagged-candidates-details', { candidates: CANDIDATES }]]);
    renderModal({ open: false });

    expect(calls).toHaveLength(0);
});

test('tells the user when the details fail to load', async () => {
    fakeBackend([['get', '/filter/flagged-candidates-details', fail(500, 'Internal server error')]]);
    renderModal();

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load candidate details'));
});

test('Close calls onClose', async () => {
    fakeBackend([['get', '/filter/flagged-candidates-details', { candidates: CANDIDATES }]]);
    const onClose = vi.fn();
    renderModal({ onClose });

    userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
});
