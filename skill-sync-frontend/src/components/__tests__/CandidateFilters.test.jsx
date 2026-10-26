import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateFilters, { toApiFilters } from '../CandidateFilters';

const DEFAULTS = { matchScoreRange: [0, 100], experienceRange: [0, 24], excludeFlagged: false };

describe('toApiFilters', () => {
    test('sends only the exclude flag when every slider is at its default', () => {
        expect(toApiFilters(DEFAULTS)).toEqual({ exclude_flagged: false });
    });

    test('sends each narrowed bound, with experience converted from months to years', () => {
        expect(toApiFilters({ matchScoreRange: [40, 90], experienceRange: [6, 18], excludeFlagged: true })).toEqual({
            min_match_score: 40,
            max_match_score: 90,
            min_experience: 0.5,
            max_experience: 1.5,
            exclude_flagged: true,
        });
    });

    test('leaves out an open end of a range', () => {
        expect(toApiFilters({ ...DEFAULTS, matchScoreRange: [55, 100], experienceRange: [0, 12] })).toEqual({
            min_match_score: 55,
            max_experience: 1,
            exclude_flagged: false,
        });
    });
});

const renderFilters = () => {
    const onApplyFilters = vi.fn();
    const onReset = vi.fn();
    render(<CandidateFilters onApplyFilters={onApplyFilters} onReset={onReset} />);
    userEvent.click(screen.getByText('Advanced Filters'));
    return { onApplyFilters, onReset };
};

test('Hide Flagged applies at once with the new value', () => {
    const { onApplyFilters } = renderFilters();

    userEvent.click(screen.getByRole('switch', { name: 'Hide Flagged' }));

    expect(onApplyFilters).toHaveBeenCalledWith({ exclude_flagged: true });
    expect(screen.getByText('1 active')).toBeInTheDocument();
});

test('Apply Filters sends the current sliders', () => {
    const { onApplyFilters } = renderFilters();

    const [minScore] = screen.getAllByRole('slider');
    fireEvent.change(minScore, { target: { value: 30 } });
    userEvent.click(screen.getByRole('button', { name: /Apply Filters/ }));

    expect(onApplyFilters).toHaveBeenLastCalledWith({ min_match_score: 30, exclude_flagged: false });
});

test('Clear All resets the filters and tells the page', () => {
    const { onReset } = renderFilters();

    userEvent.click(screen.getByRole('switch', { name: 'Hide Flagged' }));
    userEvent.click(screen.getByRole('button', { name: /Clear All/ }));

    expect(onReset).toHaveBeenCalled();
    expect(screen.queryByText(/active$/)).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Hide Flagged' })).not.toBeChecked();
});
