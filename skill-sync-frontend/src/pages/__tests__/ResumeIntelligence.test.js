import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import ResumeIntelligence from '../ResumeIntelligence';
import { fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

jest.mock('../../services/api');
jest.mock('react-hot-toast', () => {
    const toast = jest.fn();
    toast.success = jest.fn();
    toast.error = jest.fn();
    return { __esModule: true, default: toast, Toaster: () => null };
});

const RESUMES = [
    { id: 5, file_name: 'asha_cv.pdf', created_at: '2026-10-01T10:00:00', is_active: 1, extracted_skills: ['Python', 'SQL', 'Docker', 'AWS'] },
    { id: 6, file_name: 'asha_old.pdf', created_at: '2026-09-01T10:00:00', is_active: 0, extracted_skills: [] },
];

const PARSED = {
    personal_info: { name: 'Asha Raman', email: 'asha@example.com', phone: '98765', location: 'Chennai' },
    summary: 'Backend developer who ships FastAPI services.',
    skills: { technical: ['Python', 'FastAPI'], soft: ['Leadership'] },
    all_skills: ['Python', 'FastAPI', 'Leadership'],
    total_experience_years: 1.5,
    experience: [{ role: 'Intern', company: 'Acme', start_date: '2024-01', end_date: '2024-07', description: 'Built APIs' }],
    education: [{ degree: 'B.Tech', field: 'CS', institution: 'Anna University', year: '2025' }],
    projects: [{ name: 'SkillSync', description: 'Resume matching' }],
    certifications: [{ name: 'AWS Cloud Practitioner' }],
};

beforeEach(() => {
    localStorage.clear();
    signIn(student);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('lists the student resumes with their top skills', async () => {
    fakeBackend([['get', '/resume/my-resumes', RESUMES]]);
    renderAt(<ResumeIntelligence />, '/resume-intelligence');

    expect(await screen.findByText('asha_cv.pdf')).toBeInTheDocument();
    expect(screen.getByText('asha_old.pdf')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('Select a Resume to View Analysis')).toBeInTheDocument();
});

test('shows the empty state when there are no resumes', async () => {
    fakeBackend([['get', '/resume/my-resumes', []]]);
    renderAt(<ResumeIntelligence />, '/resume-intelligence');

    expect(await screen.findByText('Ready to Analyze Your Resume')).toBeInTheDocument();
});

test('opening a resume activates it, shows the analysis and saves skills to the profile', async () => {
    const calls = fakeBackend([
        ['get', '/resume/my-resumes', RESUMES],
        ['put', '/resume/6/activate', {}],
        ['get', '/resume/6/parsed-data', { structured_data: PARSED, processing_details: { skills_extracted: 3 } }],
        ['put', '/students/profile', { message: 'ok' }],
    ]);
    renderAt(<ResumeIntelligence />, '/resume-intelligence');

    userEvent.click(await screen.findByText('asha_old.pdf'));

    expect(await screen.findByText('Backend developer who ships FastAPI services.')).toBeInTheDocument();
    expect(screen.getByText('Intern at Acme')).toBeInTheDocument();
    expect(screen.getByText('Anna University - 2025')).toBeInTheDocument();
    expect(screen.getByText('1.5 years total experience')).toBeInTheDocument();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('✅ Resume activated and profile updated!'));
    expect(calls.find((c) => c.path === '/students/profile').body).toEqual({
        skills: ['Python', 'FastAPI', 'Leadership'],
        total_experience_years: 1.5,
    });
});

test('a failed analysis load shows the server error', async () => {
    fakeBackend([
        ['get', '/resume/my-resumes', RESUMES],
        ['put', '/resume/5/activate', {}],
        ['get', '/resume/5/parsed-data', fail(404, 'Resume has not been parsed yet')],
    ]);
    renderAt(<ResumeIntelligence />, '/resume-intelligence');

    userEvent.click(await screen.findByText('asha_cv.pdf'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Resume has not been parsed yet'));
});

test('deleting asks for confirmation first', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    const calls = fakeBackend([
        ['get', '/resume/my-resumes', RESUMES],
        ['delete', '/resume/6', null],
    ]);
    renderAt(<ResumeIntelligence />, '/resume-intelligence');
    await screen.findByText('asha_old.pdf');
    // eslint-disable-next-line testing-library/no-node-access
    const deleteButtons = screen.getAllByTestId('DeleteIcon').map((icon) => icon.closest('button'));

    userEvent.click(deleteButtons[1]);
    expect(calls.some((c) => c.method === 'delete')).toBe(false);

    userEvent.click(deleteButtons[1]);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resume deleted successfully'));
    expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete "asha_old.pdf"?');
    expect(calls.filter((c) => c.path === '/resume/my-resumes')).toHaveLength(2);
});

test('uploading a new resume parses it with AI', async () => {
    jest.useFakeTimers();
    const calls = fakeBackend([
        ['get', '/resume/my-resumes', []],
        ['post', '/filter/parse-resume', { structured_data: PARSED, processing_details: { skills_extracted: 3 } }],
        ['put', '/students/profile', { message: 'ok' }],
    ]);
    const { container } = renderAt(<ResumeIntelligence />, '/resume-intelligence');
    await screen.findByText('Ready to Analyze Your Resume');

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const input = container.querySelector('#resume-upload');
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'new_cv.pdf', { type: 'application/pdf' })] } });
    userEvent.click(screen.getByRole('button', { name: /Parse Resume with AI/ }));

    for (let i = 0; i < 10; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await act(async () => {
            jest.advanceTimersByTime(1500);
        });
    }

    expect(await screen.findByText('Backend developer who ships FastAPI services.')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('✨ Resume parsed and profile updated successfully!');
    expect(calls.find((c) => c.path === '/filter/parse-resume').body).toBeInstanceOf(FormData);
});

test('rejects files that are not resumes', async () => {
    fakeBackend([['get', '/resume/my-resumes', []]]);
    const { container } = renderAt(<ResumeIntelligence />, '/resume-intelligence');
    await screen.findByText('Ready to Analyze Your Resume');

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const input = container.querySelector('#resume-upload');
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });

    expect(toast.error).toHaveBeenCalledWith('Please upload a PDF, DOCX, DOC, or TXT file');
});
