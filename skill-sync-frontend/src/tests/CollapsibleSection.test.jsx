import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollapsibleSection from '../components/CollapsibleSection';
import CodeIcon from '@mui/icons-material/Code';

describe('CollapsibleSection Component', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('renders with title and content', () => {
        render(
            <CollapsibleSection title="Test Section">
                <div>Test Content</div>
            </CollapsibleSection>,
        );

        expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    test('shows count badge when provided', () => {
        render(
            <CollapsibleSection title="Skills" count={12}>
                <div>Skills Content</div>
            </CollapsibleSection>,
        );

        expect(screen.getByText('12')).toBeInTheDocument();
    });

    test('starts collapsed by default', () => {
        render(
            <CollapsibleSection title="Test Section">
                <div>Hidden Content</div>
            </CollapsibleSection>,
        );

        // Content should not be visible initially
        expect(screen.queryByText('Hidden Content')).not.toBeVisible();
    });

    test('starts expanded when defaultExpanded is true', () => {
        render(
            <CollapsibleSection title="Test Section" defaultExpanded={true}>
                <div>Visible Content</div>
            </CollapsibleSection>,
        );

        // Content should be visible initially
        expect(screen.getByText('Visible Content')).toBeVisible();
    });

    test('expands and collapses on click', async () => {
        render(
            <CollapsibleSection title="Test Section">
                <div>Toggle Content</div>
            </CollapsibleSection>,
        );

        const header = screen.getByRole('button', { name: /Test Section/ });

        // Initially collapsed
        expect(screen.queryByText('Toggle Content')).not.toBeVisible();

        // Click to expand
        fireEvent.click(header);
        expect(screen.getByText('Toggle Content')).toBeVisible();

        // Click to collapse. MUI hides the content only when the collapse transition ends.
        fireEvent.click(header);
        expect(header).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(screen.queryByText('Toggle Content')).not.toBeVisible());
    });

    test('persists state to localStorage when sectionKey is provided', () => {
        render(
            <CollapsibleSection title="Test Section" sectionKey="test_section">
                <div>Content</div>
            </CollapsibleSection>,
        );

        // Expand the section
        const header = screen.getByText('Test Section');
        fireEvent.click(header);

        // Check localStorage
        expect(localStorage.getItem('collapsible_test_section')).toBe('true');

        // Collapse the section
        fireEvent.click(header);
        expect(localStorage.getItem('collapsible_test_section')).toBe('false');
    });

    test('loads state from localStorage on mount', () => {
        // Set localStorage before rendering
        localStorage.setItem('collapsible_persisted_section', 'true');

        render(
            <CollapsibleSection title="Persisted Section" sectionKey="persisted_section">
                <div>Persisted Content</div>
            </CollapsibleSection>,
        );

        // Should start expanded based on localStorage
        expect(screen.getByText('Persisted Content')).toBeVisible();
    });

    test('renders with icon', () => {
        render(
            <CollapsibleSection title="Skills" icon={<CodeIcon data-testid="code-icon" />}>
                <div>Content</div>
            </CollapsibleSection>,
        );

        expect(screen.getByTestId('code-icon')).toBeInTheDocument();
    });

    test('applies custom sx styles', () => {
        const customSx = { backgroundColor: 'red' };

        const { container } = render(
            <CollapsibleSection title="Styled Section" sx={customSx}>
                <div>Content</div>
            </CollapsibleSection>,
        );

        // The accordion root has no accessible role, so the test reaches it by class.
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        const accordion = container.querySelector('.MuiAccordion-root');
        expect(accordion).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });
});
