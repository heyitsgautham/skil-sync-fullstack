import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import CreateInternship from '../CreateInternship';
import { company, fakeBackend, fail, signIn } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

jest.mock('../../services/api');
jest.mock('react-hot-toast', () => {
    const toast = jest.fn();
    toast.success = jest.fn();
    toast.error = jest.fn();
    return { __esModule: true, default: toast, Toaster: () => null };
});

const DESCRIPTION = 'Build FastAPI services in Python, review pull requests and ship features every week.';

beforeEach(() => {
    localStorage.clear();
    signIn(company);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const fillBasics = () => {
    userEvent.type(screen.getByLabelText(/Internship Title/), 'Backend Intern');
    userEvent.paste(screen.getByLabelText(/Job Description/), DESCRIPTION);
};

test('extracts skills, lets the company edit them, and posts the internship', async () => {
    const calls = fakeBackend([
        ['post', '/internship/extract-skills', { required_skills: ['Python', 'FastAPI'], preferred_skills: ['Docker'] }],
        ['post', '/internship/post', { id: 9 }],
    ]);
    renderAt(<CreateInternship />, '/internships/create');
    fillBasics();

    userEvent.click(screen.getByRole('button', { name: /Extract Skills from Description/ }));
    expect(await screen.findByText(/Extracted 3 skills!/)).toBeInTheDocument();

    userEvent.type(screen.getByPlaceholderText('Type a required skill...'), 'SQL{enter}');
    userEvent.type(screen.getByPlaceholderText('Type a preferred skill...'), 'Redis{enter}');
    userEvent.type(screen.getByLabelText(/Location/), 'Remote');
    userEvent.click(screen.getByRole('button', { name: /Post Internship/ }));

    expect(await screen.findByTestId('navigated-away')).toBeInTheDocument();
    const post = calls.find((c) => c.path === '/internship/post');
    expect(post.body).toMatchObject({
        title: 'Backend Intern',
        description: DESCRIPTION,
        required_skills: ['Python', 'FastAPI', 'SQL'],
        preferred_skills: ['Docker', 'Redis'],
        location: 'Remote',
    });
    expect(toast.success).toHaveBeenCalledWith('Internship posted successfully!');
});

test('extraction waits for a description', () => {
    fakeBackend([]);
    renderAt(<CreateInternship />, '/internships/create');

    expect(screen.getByRole('button', { name: /Extract Skills from Description/ })).toBeDisabled();
    userEvent.paste(screen.getByLabelText(/Job Description/), DESCRIPTION);
    expect(screen.getByRole('button', { name: /Extract Skills from Description/ })).toBeEnabled();
});

test('a document upload fills the title and description', async () => {
    const calls = fakeBackend([
        [
            'post',
            '/internship/parse-document',
            { title: 'Data Intern', description: 'Clean data with SQL', location: 'Pune', required_skills: ['SQL'], preferred_skills: [] },
        ],
    ]);
    const { container } = renderAt(<CreateInternship />, '/internships/create');

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    fireEvent.change(container.querySelector('input[type="file"]'), {
        target: { files: [new File(['jd'], 'jd.pdf', { type: 'application/pdf' })] },
    });

    await waitFor(() => expect(screen.getByLabelText(/Internship Title/)).toHaveValue('Data Intern'));
    expect(screen.getByLabelText(/Location/)).toHaveValue('Pune');
    expect(screen.getByText(/Found 1 skills in the document/)).toBeInTheDocument();
    expect(calls[0].body.get('file').name).toBe('jd.pdf');
});

test('rejects unsupported documents before uploading', () => {
    const calls = fakeBackend([]);
    const { container } = renderAt(<CreateInternship />, '/internships/create');

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    fireEvent.change(container.querySelector('input[type="file"]'), {
        target: { files: [new File(['x'], 'jd.png', { type: 'image/png' })] },
    });

    expect(screen.getByText('Invalid file type. Supported formats: PDF, DOCX, DOC, TXT')).toBeInTheDocument();
    expect(calls).toEqual([]);
});

test('removing a skill chip drops it from the post', async () => {
    const calls = fakeBackend([
        ['post', '/internship/extract-skills', { required_skills: ['Python', 'Java'], preferred_skills: [] }],
        ['post', '/internship/post', { id: 9 }],
    ]);
    renderAt(<CreateInternship />, '/internships/create');
    fillBasics();
    userEvent.click(screen.getByRole('button', { name: /Extract Skills from Description/ }));
    const javaChip = (await screen.findByText('Java')).closest('.MuiChip-root'); // eslint-disable-line testing-library/no-node-access

    // eslint-disable-next-line testing-library/no-node-access
    userEvent.click(javaChip.querySelector('.MuiChip-deleteIcon'));
    userEvent.click(screen.getByRole('button', { name: /Post Internship/ }));

    await screen.findByTestId('navigated-away');
    expect(calls.find((c) => c.path === '/internship/post').body.required_skills).toEqual(['Python']);
});

test('shows the server error when posting fails', async () => {
    fakeBackend([['post', '/internship/post', fail(403, 'Only companies can post internships')]]);
    renderAt(<CreateInternship />, '/internships/create');
    fillBasics();

    userEvent.click(screen.getByRole('button', { name: /Post Internship/ }));

    expect(await screen.findByText('Only companies can post internships')).toBeInTheDocument();
});
