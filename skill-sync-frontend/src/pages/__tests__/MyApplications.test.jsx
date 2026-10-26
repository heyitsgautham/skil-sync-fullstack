import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyApplications, { formatAppliedDate } from '../MyApplications';
import { company, fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const API = '/internship/applications/my-applications';

const APPLICATIONS = [
    {
        id: 7,
        internship_id: 2,
        status: 'shortlisted',
        match_score: 81,
        used_tailored_resume: 1,
        created_at: '2026-10-25 09:30:00.123456+00:00',
        internship_title: 'Design Intern',
        company_name: 'Pixel Co',
        internship_location: 'Remote',
        internship_is_active: false,
    },
    {
        id: 3,
        internship_id: 1,
        status: 'pending',
        match_score: null,
        used_tailored_resume: 0,
        created_at: '2026-10-20 12:00:00+00:00',
        internship_title: 'Backend Intern',
        company_name: 'Acme Labs',
        internship_location: 'Chennai',
        internship_is_active: true,
    },
];

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

test('a student sees each application with its company, status and score, in the order the API sends', async () => {
    signIn(student);
    fakeBackend([['get', API, APPLICATIONS]]);
    renderAt(<MyApplications />, '/applications');

    const rows = await screen.findAllByTestId('application-row');
    expect(rows).toHaveLength(2);

    const design = within(rows[0]);
    expect(design.getByText('Design Intern')).toBeInTheDocument();
    expect(design.getByText('Pixel Co')).toBeInTheDocument();
    expect(design.getByText('Shortlisted')).toBeInTheDocument();
    expect(design.getByText('81% match')).toBeInTheDocument();
    expect(design.getByText('Posting closed')).toBeInTheDocument();
    expect(design.getByText('Tailored resume')).toBeInTheDocument();
    expect(design.getByText('Applied 25 Oct 2026')).toBeInTheDocument();

    const backend = within(rows[1]);
    expect(backend.getByText('Backend Intern')).toBeInTheDocument();
    expect(backend.getByText('Under review')).toBeInTheDocument();
    expect(backend.getByText('Chennai')).toBeInTheDocument();
    expect(backend.queryByText(/% match/)).not.toBeInTheDocument();
    expect(backend.queryByText('Posting closed')).not.toBeInTheDocument();
});

test('with no applications the page sends the student to browse internships', async () => {
    signIn(student);
    fakeBackend([['get', API, []]]);
    renderAt(<MyApplications />, '/applications');

    expect(await screen.findByText('No applications yet')).toBeInTheDocument();
    userEvent.click(within(screen.getByRole('main')).getByRole('button', { name: 'Browse Internships' }));

    expect(screen.getByTestId('navigated-away')).toBeInTheDocument();
});

test('a failed load shows the reason and retries on request', async () => {
    signIn(student);
    let attempts = 0;
    fakeBackend([['get', API, () => (++attempts === 1 ? fail(503, 'Database unavailable') : APPLICATIONS.slice(1))]]);
    renderAt(<MyApplications />, '/applications');

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Backend Intern')).toBeInTheDocument();
    expect(screen.queryByText('Database unavailable')).not.toBeInTheDocument();
});

test('the sidebar gives students their applications and the internship list, and companies neither', async () => {
    signIn(student);
    fakeBackend([['get', API, []]]);
    const { unmount } = renderAt(<MyApplications />, '/applications');
    await screen.findByText('No applications yet');

    const sidebar = within(screen.getByRole('navigation'));
    expect(sidebar.getByRole('button', { name: 'Browse Internships' })).toBeInTheDocument();
    expect(sidebar.getByRole('button', { name: 'My Applications' })).toBeInTheDocument();
    // The top bar names the page from the selected menu item
    expect(within(screen.getByRole('banner')).getByText('My Applications')).toBeInTheDocument();
    unmount();

    signIn(company);
    fakeBackend([['get', API, fail(403, 'Only students can view their applications')]]);
    renderAt(<MyApplications />, '/applications');
    await screen.findByText('Only students can view their applications');
    expect(within(screen.getByRole('navigation')).queryByText('Browse Internships')).not.toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).queryByText('My Applications')).not.toBeInTheDocument();
});

test('formatAppliedDate reads the API timestamp and ignores what it cannot parse', () => {
    expect(formatAppliedDate('2026-10-25 09:30:00.123456+00:00')).toBe('25 Oct 2026');
    expect(formatAppliedDate('2026-01-02T03:04:05Z')).toBe('2 Jan 2026');
    expect(formatAppliedDate('')).toBe('');
    expect(formatAppliedDate('not a date')).toBe('');
});
