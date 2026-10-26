import { render, screen } from '@testing-library/react';
import ActiveFilters from '../ActiveFilters';

test('shows nothing when no filter narrows the list', () => {
    const { container } = render(<ActiveFilters filters={{ min_match_score: 0, max_experience: 5 }} />);

    expect(container).toBeEmptyDOMElement();
});

test('shows a match range and an experience range in years and months', () => {
    render(
        <ActiveFilters
            filters={{ min_match_score: 60, max_match_score: 90, min_experience: 0.5, max_experience: 1.25 }}
            totalCandidates={12}
            totalBeforeFilter={48}
        />,
    );

    expect(screen.getByText('Match 60% - 90%')).toBeInTheDocument();
    expect(screen.getByText('Experience 6m - 1y 3m')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/25% match filters/)).toBeInTheDocument();
});

test.each([
    [{ min_match_score: 70 }, 'Match ≥ 70%'],
    [{ max_match_score: 40 }, 'Match ≤ 40%'],
    [{ min_experience: 2 }, 'Experience ≥ 2y'],
    [{ max_experience: 0.75 }, 'Experience ≤ 9m'],
    [{ exclude_flagged: true }, '🚫 Excluding flagged'],
])('shows a one-sided filter as its own chip', (filters, label) => {
    render(<ActiveFilters filters={filters} />);

    expect(screen.getByText(label)).toBeInTheDocument();
});

test('hides the count line when the filters removed nobody', () => {
    render(<ActiveFilters filters={{ exclude_flagged: true }} totalCandidates={8} totalBeforeFilter={8} />);

    expect(screen.queryByText(/match filters/)).not.toBeInTheDocument();
});
