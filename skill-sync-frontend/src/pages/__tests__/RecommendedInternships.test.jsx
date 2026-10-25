import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import RecommendedInternships from '../RecommendedInternships';
import { fakeBackend, fail, signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

vi.mock('../../services/api');
vi.mock('react-hot-toast', () => {
    const toast = vi.fn();
    toast.success = vi.fn();
    toast.error = vi.fn();
    return { __esModule: true, default: toast, Toaster: () => null };
});

const listing = (id, score, location, skills = ['Python']) => ({
    id,
    title: `Internship ${id}`,
    company_name: `Company ${id}`,
    description: `Description ${id}`,
    match_score: score,
    location,
    required_skills: skills,
    has_applied: false,
});

const SEVEN = [
    listing(1, 55, 'Remote'),
    listing(2, 92, 'Chennai'),
    listing(3, 70, 'Remote', ['React']),
    listing(4, 81, 'Pune'),
    listing(5, 64, 'Remote'),
    listing(6, 88, 'Remote', ['Go']),
    listing(7, 40, 'Delhi'),
];

const titles = () => screen.queryAllByText(/^Internship \d$/).map((node) => node.textContent);

beforeEach(() => {
    localStorage.clear();
    signIn(student);
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

test('shows the five best matches first', async () => {
    const calls = fakeBackend([['get', '/internship/match', SEVEN]]);
    renderAt(<RecommendedInternships />, '/recommendations');

    await screen.findByText('Internship 2');

    expect(titles()).toEqual(['Internship 2', 'Internship 6', 'Internship 4', 'Internship 3', 'Internship 5']);
    expect(calls[0].params).toEqual({ top_k: 50 });
});

test('the second page holds the rest', async () => {
    fakeBackend([['get', '/internship/match', SEVEN]]);
    renderAt(<RecommendedInternships />, '/recommendations?page=2');

    await screen.findByText('Internship 1');

    expect(titles()).toEqual(['Internship 1', 'Internship 7']);
});

test('filters from the URL apply to the list', async () => {
    fakeBackend([['get', '/internship/match', SEVEN]]);
    renderAt(<RecommendedInternships />, '/recommendations?minScore=60&location=remote');

    await screen.findByText('Internship 6');

    expect(titles()).toEqual(['Internship 6', 'Internship 3', 'Internship 5']);
});

test('ascending sort reverses the order', async () => {
    fakeBackend([['get', '/internship/match', SEVEN]]);
    renderAt(<RecommendedInternships />, '/recommendations?sortOrder=asc&pageSize=10');

    await screen.findByText('Internship 7');

    expect(titles()[0]).toBe('Internship 7');
    userEvent.click(screen.getByRole('button', { name: 'descending' }));
    expect(titles()[0]).toBe('Internship 2');
});

test('filters that match nothing show the no-match state', async () => {
    fakeBackend([['get', '/internship/match', SEVEN]]);
    renderAt(<RecommendedInternships />, '/recommendations?minScore=99');

    expect(await screen.findByText('No Matching Jobs Found')).toBeInTheDocument();
});

test('a student without a resume is sent to upload one', async () => {
    fakeBackend([['get', '/internship/match', fail(404, 'No active resume found. Please upload a resume first.')]]);
    renderAt(<RecommendedInternships />, '/recommendations');

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/No active resume found/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Please upload your resume first to get recommendations');

    userEvent.click(within(alert).getByRole('button', { name: /Upload Resume/ }));
    expect(screen.getByTestId('navigated-away')).toBeInTheDocument();
});

test('validation errors are joined into one message', async () => {
    fakeBackend([['get', '/internship/match', fail(422, [{ msg: 'top_k too large' }, { msg: 'bad token' }])]]);
    renderAt(<RecommendedInternships />, '/recommendations');

    expect(await screen.findByText('top_k too large, bad token')).toBeInTheDocument();
});
