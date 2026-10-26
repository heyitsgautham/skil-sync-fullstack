import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from '../FilterPanel';

const DEFAULTS = { minScore: 0, maxScore: 100, experienceMin: 0, experienceMax: 10, skills: [], location: '' };

function renderPanel(props = {}) {
    const onFilterChange = vi.fn();
    const onClear = vi.fn();
    const utils = render(
        <FilterPanel
            filters={DEFAULTS}
            onFilterChange={onFilterChange}
            onClear={onClear}
            availableSkills={['Python', 'React', 'SQL']}
            showLocation
            showDaysPosted
            {...props}
        />,
    );
    return { ...utils, onFilterChange, onClear };
}

const applyButton = () => screen.getByRole('button', { name: /Apply Filters/ });

test('edits wait for Apply Filters, which sends every field at once', () => {
    const { onFilterChange } = renderPanel();
    expect(applyButton()).toBeDisabled();

    userEvent.type(screen.getByLabelText('Location'), 'Chennai');
    userEvent.click(screen.getByLabelText('Filter by Skills'));
    userEvent.click(screen.getByRole('option', { name: 'React' }));

    expect(onFilterChange).not.toHaveBeenCalled();
    expect(applyButton()).toHaveTextContent('Apply Filters (Modified)');

    userEvent.click(applyButton());

    expect(onFilterChange).toHaveBeenCalledWith({ ...DEFAULTS, location: 'Chennai', skills: ['React'] });
});

test('a posted-within choice is applied with the rest', () => {
    const { onFilterChange } = renderPanel();

    // The select is labelled, so assistive technology announces what it filters
    userEvent.click(screen.getByRole('combobox', { name: 'Posted Within' }));
    userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Last 14 Days' }));
    userEvent.click(applyButton());

    expect(onFilterChange).toHaveBeenCalledWith({ ...DEFAULTS, daysPosted: 14 });
});

test('the header counts only filters that differ from the defaults, and Clear All clears them', () => {
    const { onClear } = renderPanel({
        filters: { ...DEFAULTS, minScore: 60, skills: ['SQL'], location: 'Pune' },
    });

    expect(screen.getByText('3 active')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    // Clearing does not also collapse the panel through the header's click handler
    expect(screen.getByLabelText('Location')).toBeVisible();
});

test('with default filters there is no count and no Clear All', () => {
    renderPanel();

    expect(screen.queryByText(/active$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument();
});

test('new filters from the parent replace unsaved edits', () => {
    const { rerender, onFilterChange, onClear } = renderPanel();
    userEvent.type(screen.getByLabelText('Location'), 'Delhi');

    rerender(
        <FilterPanel
            filters={{ ...DEFAULTS, location: 'Remote' }}
            onFilterChange={onFilterChange}
            onClear={onClear}
            availableSkills={[]}
            showLocation
        />,
    );

    expect(screen.getByLabelText('Location')).toHaveValue('Remote');
    expect(applyButton()).toBeDisabled();
    expect(screen.queryByLabelText('Filter by Skills')).not.toBeInTheDocument();
});

test('the education and status selects are labelled too', () => {
    renderPanel({ showEducation: true, showApplicationStatus: true });

    expect(screen.getByRole('combobox', { name: 'Education Level' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Application Status' })).toBeInTheDocument();
});

test('the optional fields appear only when asked for', () => {
    renderPanel({ showLocation: false, showDaysPosted: false, showExperience: false });

    expect(screen.queryByLabelText('Location')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Posted Within' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Experience:/)).not.toBeInTheDocument();
    expect(screen.getByText('Match Score Range: 0% - 100%')).toBeInTheDocument();
});
