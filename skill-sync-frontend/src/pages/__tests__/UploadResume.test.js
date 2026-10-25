import React from 'react';
import { createEvent, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import UploadResume from '../UploadResume';
import { fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

jest.mock('../../services/api');
jest.mock('react-hot-toast', () => {
    const toast = jest.fn();
    toast.success = jest.fn();
    toast.error = jest.fn();
    return { __esModule: true, default: toast, Toaster: () => null };
});

const SKILLS = ['Python', 'SQL', 'Docker', 'AWS', 'React', 'Go', 'Rust', 'Kotlin'];
const RESUMES = [
    { id: 5, file_name: 'current_cv.pdf', is_active: 1, extracted_skills: SKILLS, uploaded_at: '2026-10-01T10:00:00' },
    { id: 6, file_name: 'old_cv.pdf', is_active: 0, extracted_skills: ['Java'], uploaded_at: '2026-09-01T10:00:00' },
];

const pdf = (name = 'new_cv.pdf', type = 'application/pdf') => new File(['%PDF'], name, { type });
const fileInput = () => document.getElementById('resume-file-input'); // eslint-disable-line testing-library/no-node-access

beforeEach(() => {
    localStorage.clear();
    signIn(student);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test('lists resumes, marks the active one and expands long skill lists', async () => {
    fakeBackend([['get', '/resume/my-resumes', RESUMES]]);
    renderAt(<UploadResume />, '/upload-resume');

    expect(await screen.findByText('current_cv.pdf')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Kotlin')).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Show All/ }));

    expect(screen.getByText('Kotlin')).toBeInTheDocument();
});

test('uploads a selected resume and refreshes the list', async () => {
    const calls = fakeBackend([
        ['get', '/resume/my-resumes', RESUMES],
        ['post', '/resume/upload', { id: 7 }],
    ]);
    renderAt(<UploadResume />, '/upload-resume');
    await screen.findByText('current_cv.pdf');

    userEvent.upload(fileInput(), pdf());
    userEvent.click(screen.getByRole('button', { name: /Upload & Parse Resume/ }));

    expect(await screen.findByText('Resume uploaded and parsed successfully!')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/resume/upload').body.get('file').name).toBe('new_cv.pdf');
    await waitFor(() => expect(calls.filter((c) => c.path === '/resume/my-resumes')).toHaveLength(2));
});

test('rejects unsupported and oversized files', async () => {
    fakeBackend([['get', '/resume/my-resumes', []]]);
    renderAt(<UploadResume />, '/upload-resume');

    fireEvent.change(fileInput(), { target: { files: [pdf('photo.png', 'image/png')] } });
    expect(await screen.findByText('Please select a PDF, Word document, or TXT file')).toBeInTheDocument();

    const big = pdf();
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(fileInput(), { target: { files: [big] } });
    expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
});

test('a dropped file is validated like a selected one', async () => {
    fakeBackend([['get', '/resume/my-resumes', []]]);
    renderAt(<UploadResume />, '/upload-resume');
    const dropZone = await screen.findByText(/Drag & drop/i);

    const drop = createEvent.drop(dropZone);
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [pdf('photo.png', 'image/png')] } });
    fireEvent(dropZone, drop);

    expect(toast.error).toHaveBeenCalledWith('Please select a PDF, Word document, or TXT file');
});

test('a failed upload shows the server message', async () => {
    fakeBackend([
        ['get', '/resume/my-resumes', []],
        ['post', '/resume/upload', fail(400, 'Invalid file type. Allowed: .pdf, .docx, .doc, .txt')],
    ]);
    renderAt(<UploadResume />, '/upload-resume');

    userEvent.upload(fileInput(), pdf());
    userEvent.click(await screen.findByRole('button', { name: /Upload & Parse Resume/ }));

    expect(await screen.findByText('Invalid file type. Allowed: .pdf, .docx, .doc, .txt')).toBeInTheDocument();
});

test('sets another resume active and deletes one after confirming', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const calls = fakeBackend([
        ['get', '/resume/my-resumes', RESUMES],
        ['put', '/resume/6/activate', {}],
        ['delete', '/resume/6', null],
    ]);
    renderAt(<UploadResume />, '/upload-resume');
    await screen.findByText('old_cv.pdf');

    userEvent.click(screen.getByRole('button', { name: 'Set Active' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resume set as active'));

    // eslint-disable-next-line testing-library/no-node-access
    const deleteButtons = screen.getAllByTestId('DeleteIcon').map((icon) => icon.closest('button'));
    userEvent.click(deleteButtons[1]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resume deleted successfully'));
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(
        expect.arrayContaining(['put /resume/6/activate', 'delete /resume/6'])
    );
});
