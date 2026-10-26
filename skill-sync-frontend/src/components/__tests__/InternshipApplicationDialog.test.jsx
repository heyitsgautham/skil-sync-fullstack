import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InternshipApplicationDialog from '../InternshipApplicationDialog';
import { fakeBackend, fail, signIn, student } from '../../testUtils/backend';

vi.mock('../../services/api');

const INTERNSHIP = { id: 7, title: 'Data Intern', company_name: 'Acme Labs' };

const renderDialog = (props = {}) => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(
        <InternshipApplicationDialog open internship={INTERNSHIP} onClose={onClose} onSuccess={onSuccess} {...props} />,
    );
    return { onClose, onSuccess };
};

const chooseFile = (file) => {
    // The file input is hidden inside the Choose File button.
    // eslint-disable-next-line testing-library/no-node-access
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
};

const tailor = () => userEvent.click(screen.getByRole('checkbox', { name: /Upload tailored resume/ }));

beforeEach(() => {
    localStorage.clear();
    signIn(student);
});

test('applies with the active resume and reports the score', async () => {
    const calls = fakeBackend([
        ['post', '/internship/7/apply', { application_similarity_score: 82, used_tailored_resume: 0 }],
    ]);
    const { onClose, onSuccess } = renderDialog();

    userEvent.click(screen.getByRole('button', { name: 'Submit Application' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSuccess.mock.calls[0][0].message).toBe('Successfully applied with active resume! Match score: 82%');
    expect(calls[0].body.get('use_tailored_resume')).toBe('false');
    expect(calls[0].body.has('tailored_resume')).toBe(false);
    expect(onClose).toHaveBeenCalled();
});

test('applies with a tailored resume file', async () => {
    const calls = fakeBackend([['post', '/internship/7/apply', { match_score: 90, used_tailored_resume: 1 }]]);
    const { onSuccess } = renderDialog();

    tailor();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeDisabled();
    chooseFile(new File(['Asha resume'], 'asha-data.pdf', { type: 'application/pdf' }));
    expect(screen.getByText('asha-data.pdf')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Submit Application' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSuccess.mock.calls[0][0].resumeType).toBe('tailored');
    expect(calls[0].body.get('use_tailored_resume')).toBe('true');
    expect(calls[0].body.get('tailored_resume').name).toBe('asha-data.pdf');
});

test.each([
    [new File(['x'], 'resume.exe'), 'Invalid file type. Allowed: .pdf, .doc, .docx, .txt'],
    [
        Object.defineProperty(new File(['x'], 'big.pdf'), 'size', { value: 11 * 1024 * 1024 }),
        'File size must be less than 10MB',
    ],
])('refuses a file it cannot send', (file, message) => {
    fakeBackend([]);
    renderDialog();

    tailor();
    chooseFile(file);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeDisabled();
});

test('shows the reason when the application is refused', async () => {
    fakeBackend([['post', '/internship/7/apply', fail(400, 'You have already applied to this internship')]]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onSuccess } = renderDialog();

    userEvent.click(screen.getByRole('button', { name: 'Submit Application' }));

    expect(await screen.findByText('You have already applied to this internship')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
});

test('renders nothing without an internship', () => {
    fakeBackend([]);
    renderDialog({ internship: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
