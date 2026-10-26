import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendEmailModal from '../SendEmailModal';
import { company, fakeBackend, fail, signIn } from '../../testUtils/backend';

vi.mock('../../services/api');

const CANDIDATES = [
    { candidate_id: 5, student_id: 5, candidate_name: 'Asha Raman', match_score: 88.25 },
    { candidate_id: 9, student_id: 9, candidate_name: 'Ravi Kumar' },
];

const renderModal = (props = {}) =>
    render(
        <SendEmailModal
            open
            onClose={vi.fn()}
            selectedCandidates={CANDIDATES}
            internshipTitle="Data Intern"
            internshipId={7}
            onSendComplete={vi.fn()}
            {...props}
        />,
    );

beforeEach(() => {
    localStorage.clear();
    signIn(company);
});

test('lists the recipients and prefills a subject naming the internship', () => {
    fakeBackend([]);
    renderModal();

    expect(screen.getByText('2 Selected')).toBeInTheDocument();
    expect(screen.getByText('ID: 5 • Score: 88.3%')).toBeInTheDocument();
    expect(screen.getByText('ID: 9')).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toHaveValue('Congratulations! Next Round - Data Intern');
});

test('sends the edited subject and message to the selected students', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = fakeBackend([
        ['post', '/candidate-emails/send-to-candidates', { emails_sent: 2, failed_emails: 0, message: 'ok' }],
    ]);
    const onSendComplete = vi.fn();
    renderModal({ onSendComplete });

    userEvent.clear(screen.getByLabelText(/Subject/));
    userEvent.paste(screen.getByLabelText(/Subject/), 'Interview invite');
    userEvent.click(screen.getByRole('button', { name: 'Send to 2 Candidates' }));

    expect(await screen.findByText(/Successfully sent 2 email\(s\)!/)).toBeInTheDocument();
    const body = calls[0].body;
    expect(body.internship_id).toBe(7);
    expect(body.candidate_ids).toEqual([5, 9]);
    expect(body.subject).toBe('Interview invite');
    expect(body.message).toMatch(/selected for the next round/);
    expect(screen.queryByRole('button', { name: /Send to/ })).not.toBeInTheDocument();

    vi.advanceTimersByTime(2000);
    expect(onSendComplete).toHaveBeenCalledWith(expect.objectContaining({ emails_sent: 2 }));
    vi.useRealTimers();
});

test('reports partial failures', async () => {
    fakeBackend([
        ['post', '/candidate-emails/send-to-candidates', { emails_sent: 1, failed_emails: 1, message: 'ok' }],
    ]);
    renderModal();

    userEvent.click(screen.getByRole('button', { name: 'Send to 2 Candidates' }));

    expect(await screen.findByText(/1 email\(s\) failed to send/)).toBeInTheDocument();
});

test('shows the server error and lets the company try again', async () => {
    fakeBackend([['post', '/candidate-emails/send-to-candidates', fail(500, 'Failed to send emails')]]);
    renderModal();

    userEvent.click(screen.getByRole('button', { name: 'Send to 2 Candidates' }));

    expect(await screen.findByText('Failed to send emails')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send to 2 Candidates' })).toBeEnabled();
});

test('cannot send an empty subject', () => {
    fakeBackend([]);
    renderModal();

    userEvent.clear(screen.getByLabelText(/Subject/));

    expect(screen.getByRole('button', { name: 'Send to 2 Candidates' })).toBeDisabled();
});

test('closing restores the default text for the next time', () => {
    fakeBackend([]);
    const onClose = vi.fn();
    const { rerender } = renderModal({ onClose });

    userEvent.clear(screen.getByLabelText(/Subject/));
    userEvent.paste(screen.getByLabelText(/Subject/), 'Something else');
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    rerender(
        <SendEmailModal
            open
            onClose={onClose}
            selectedCandidates={CANDIDATES}
            internshipTitle="Data Intern"
            internshipId={7}
        />,
    );

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByLabelText(/Subject/)).toHaveValue('Congratulations! Next Round - Data Intern');
});
