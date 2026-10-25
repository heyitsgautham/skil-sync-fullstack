import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyProfile from '../company/CompanyProfile';
import { company, fakeBackend, fail, signIn } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');

const PROFILE = {
    id: 21,
    email: 'hr@acme.test',
    full_name: 'Acme Labs',
    hr_contact_name: 'Priya',
    mailing_email: null,
    phone: '98765 43210',
    phone_visible: true,
    role: 'company',
};

const STATS = {
    jobs: [
        {
            internship_id: 7,
            internship_title: 'Data Intern',
            total_applicants: 10,
            great_matches: 3,
            good_matches: 5,
            bad_matches: 2,
            tailored_resume_count: 1,
        },
    ],
};

beforeEach(() => {
    localStorage.clear();
    signIn(company);
});

const field = (label) => screen.getByLabelText(label);

const pickJob = async () => {
    userEvent.click(screen.getByRole('combobox'));
    userEvent.click(await screen.findByRole('option', { name: /Data Intern/ }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
};

test('shows the saved profile read-only, with the login email as the default mailing email', async () => {
    fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['get', '/profile/job-email-stats', STATS],
    ]);
    renderAt(<CompanyProfile />, '/company/profile');

    expect(await screen.findByDisplayValue('Acme Labs')).toBeDisabled();
    expect(field('HR Contact Name')).toHaveValue('Priya');
    expect(field('Mailing Email')).toHaveValue('hr@acme.test');
    expect(field('Phone Number')).toHaveValue('98765 43210');
});

test('editing and saving sends the form as a profile update', async () => {
    const calls = fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['get', '/profile/job-email-stats', STATS],
        ['put', '/profile/me', ({ body }) => ({ ...PROFILE, ...body })],
    ]);
    renderAt(<CompanyProfile />, '/company/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.clear(field('HR Contact Name'));
    userEvent.paste(field('HR Contact Name'), 'Ravi');
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
    const update = calls.find((c) => c.method === 'put');
    expect(update.body).toEqual({
        full_name: 'Acme Labs',
        hr_contact_name: 'Ravi',
        email: 'hr@acme.test',
        mailing_email: 'hr@acme.test',
        phone: '98765 43210',
        phone_visible: true,
    });
    expect(field('HR Contact Name')).toBeDisabled();
});

test('a failed save keeps the form open and reports the error', async () => {
    fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['get', '/profile/job-email-stats', STATS],
        ['put', '/profile/me', fail(422, 'value is not a valid email address')],
    ]);
    renderAt(<CompanyProfile />, '/company/profile');

    userEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    userEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText(/^Error:/)).toBeInTheDocument();
    expect(field('HR Contact Name')).toBeEnabled();
});

test('sends the report email for the chosen job with only the ticked match buckets', async () => {
    const calls = fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['get', '/profile/job-email-stats', STATS],
        ['post', '/profile/send-job-email/7', { total_applicants: 8 }],
    ]);
    renderAt(<CompanyProfile />, '/company/profile');
    await screen.findByDisplayValue('Acme Labs');

    await pickJob();
    userEvent.click(screen.getByRole('checkbox', { name: /ALL/ }));
    userEvent.click(screen.getByRole('checkbox', { name: /GREAT MATCHES/ }));
    userEvent.click(screen.getByRole('checkbox', { name: /GOOD MATCHES/ }));
    userEvent.click(screen.getByRole('button', { name: /Send Email/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Great Matches/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Other Matches/)).not.toBeInTheDocument();
    userEvent.click(within(dialog).getByRole('button', { name: /Send Email/ }));

    expect(await screen.findByText('Email sent successfully! 8 applicants included.')).toBeInTheDocument();
    const send = calls.find((c) => c.method === 'post');
    expect(send.url).toMatch(/\/profile\/send-job-email\/7\?filters=great&filters=good$/);
    // The form resets to no job, so the send button waits for the next choice.
    await waitFor(() => expect(screen.getByRole('button', { name: /Send Email/ })).toBeDisabled());
});

test('the send button stays disabled until a job is chosen', async () => {
    fakeBackend([
        ['get', '/profile/me', PROFILE],
        ['get', '/profile/job-email-stats', STATS],
    ]);
    renderAt(<CompanyProfile />, '/company/profile');
    await screen.findByDisplayValue('Acme Labs');

    await waitFor(() => expect(screen.getByRole('button', { name: /Send Email/ })).toBeDisabled());
    await pickJob();
    expect(screen.getByRole('button', { name: /Send Email/ })).toBeEnabled();
});
