import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InternshipList from '../InternshipList';
import { admin, company, fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const LISTINGS = [
    {
        id: 1,
        title: 'Backend Intern',
        description: 'Build FastAPI services',
        company_name: 'Acme Labs',
        location: 'Chennai',
        required_skills: ['Python', 'FastAPI'],
        preferred_skills: ['Docker'],
        is_active: 1,
    },
    {
        id: 2,
        title: 'Design Intern',
        description: 'Shape the product in Figma',
        company_name: 'Pixel Co',
        location: 'Remote',
        required_skills: ['Figma'],
        is_active: 1,
    },
];

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

test('students browse every listing and can search them', async () => {
    signIn(student);
    const calls = fakeBackend([['get', '/internship/list', LISTINGS]]);
    renderAt(<InternshipList />, '/internships');

    expect(await screen.findByText('Backend Intern')).toBeInTheDocument();
    expect(screen.getByText('Design Intern')).toBeInTheDocument();
    expect(calls[0].path).toBe('/internship/list');

    userEvent.paste(screen.getByPlaceholderText(/Search by title/), 'figma');

    expect(screen.queryByText('Backend Intern')).not.toBeInTheDocument();
    expect(screen.getByText('Design Intern')).toBeInTheDocument();
});

test('a student applies with their active resume', async () => {
    signIn(student);
    const calls = fakeBackend([
        ['get', '/internship/list', LISTINGS],
        ['post', '/internship/1/apply', { match_score: 87, used_tailored_resume: 0 }],
    ]);
    renderAt(<InternshipList />, '/internships');

    const [firstApply] = await screen.findAllByRole('button', { name: 'Apply Now' });
    userEvent.click(firstApply);
    const dialog = await screen.findByRole('dialog');
    userEvent.click(within(dialog).getByRole('button', { name: 'Submit Application' }));

    expect(await screen.findByText('Successfully applied with active resume! Match score: 87%')).toBeInTheDocument();
    const apply = calls.find((c) => c.path === '/internship/1/apply');
    expect(apply.body.get('use_tailored_resume')).toBe('false');
});

test('a student sees which internships they already applied to, and the list updates after applying', async () => {
    signIn(student);
    const applied = [{ id: 5, internship_id: 2, status: 'pending' }];
    fakeBackend([
        ['get', '/internship/list', LISTINGS],
        ['get', '/internship/applications/my-applications', () => applied],
        [
            'post',
            '/internship/1/apply',
            () => {
                applied.push({ id: 6, internship_id: 1, status: 'pending' });
                return { match_score: 70, used_tailored_resume: 0 };
            },
        ],
    ]);
    renderAt(<InternshipList />, '/internships');

    const appliedButton = await screen.findByRole('button', { name: 'Applied' });
    expect(appliedButton).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Apply Now' })).toHaveLength(1);

    userEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    const dialog = await screen.findByRole('dialog');
    userEvent.click(within(dialog).getByRole('button', { name: 'Submit Application' }));

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Applied' })).toHaveLength(2));
    expect(screen.queryByRole('button', { name: 'Apply Now' })).not.toBeInTheDocument();
});

test('a failed application stays in the dialog with the error', async () => {
    signIn(student);
    fakeBackend([
        ['get', '/internship/list', LISTINGS],
        ['post', '/internship/1/apply', fail(400, 'You have already applied to this internship')],
    ]);
    renderAt(<InternshipList />, '/internships');

    const [firstApply] = await screen.findAllByRole('button', { name: 'Apply Now' });
    userEvent.click(firstApply);
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Submit Application' }));

    expect(await screen.findByText('You have already applied to this internship')).toBeInTheDocument();
});

test('a company edits its post from the details dialog', async () => {
    signIn(company);
    const calls = fakeBackend([
        ['get', '/internship/my-posts', [LISTINGS[0]]],
        ['put', '/internship/1', { ...LISTINGS[0], title: 'Backend Engineering Intern' }],
    ]);
    renderAt(<InternshipList />, '/internships');

    userEvent.click(await screen.findByRole('button', { name: 'View Details' }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Edit Internship/ }));
    const dialog = await screen.findByRole('dialog', { name: /Edit Internship/ });
    const title = within(dialog).getByLabelText(/Title/);
    userEvent.clear(title);
    userEvent.paste(title, 'Backend Engineering Intern');
    const skills = within(dialog).getByLabelText(/Required Skills/);
    userEvent.clear(skills);
    userEvent.paste(skills, 'Python, Go');
    userEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Internship updated successfully')).toBeInTheDocument();
    const put = calls.find((c) => c.method === 'put');
    expect(put.body.title).toBe('Backend Engineering Intern');
    expect(put.body.required_skills).toEqual(['Python', 'Go']);
});

test('an admin deletes a listing after confirming', async () => {
    signIn(admin);
    const calls = fakeBackend([
        ['get', '/internship/list', [LISTINGS[0]]],
        ['delete', '/internship/1', null],
    ]);
    renderAt(<InternshipList />, '/internships');

    userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete Internship' }));

    await waitFor(() => expect(calls.some((c) => c.method === 'delete' && c.path === '/internship/1')).toBe(true));
});

test('companies open the details dialog instead of applying', async () => {
    signIn(company);
    fakeBackend([['get', '/internship/my-posts', [LISTINGS[0]]]]);
    renderAt(<InternshipList />, '/internships');

    userEvent.click(await screen.findByRole('button', { name: 'View Details' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Internship Details')).toBeInTheDocument();
    expect(within(dialog).getByText('Docker')).toBeInTheDocument();
});

test('the details dialog shows the posting date, and leaves it out when there is none', async () => {
    signIn(company);
    const posted = '2026-10-20T09:30:00Z';
    fakeBackend([
        [
            'get',
            '/internship/my-posts',
            [
                { ...LISTINGS[0], created_at: posted },
                { ...LISTINGS[1], created_at: null },
            ],
        ],
    ]);
    renderAt(<InternshipList />, '/internships');

    const [first, second] = await screen.findAllByRole('button', { name: 'View Details' });
    userEvent.click(first);
    const dialog = await screen.findByRole('dialog');
    const expected = `Posted on: ${new Date(posted).toLocaleDateString()} | Status: Active`;
    expect(within(dialog).getByText(expected)).toBeInTheDocument();
    userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    userEvent.click(second);
    const other = await screen.findByRole('dialog');
    expect(within(other).getByText('Status: Active')).toBeInTheDocument();
    expect(within(other).queryByText(/Invalid Date/)).not.toBeInTheDocument();
});

test('a load failure shows the error', async () => {
    signIn(student);
    fakeBackend([['get', '/internship/list', fail(500, 'Database unavailable')]]);
    renderAt(<InternshipList />, '/internships');

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
});
