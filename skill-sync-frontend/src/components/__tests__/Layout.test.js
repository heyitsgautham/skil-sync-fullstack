import React from 'react';
import { render } from '@testing-library/react';

describe('Layout Component', () => {
    test('renders a simple component', () => {
        const TestComponent = () => <div>Test Content</div>;
        const { getByText } = render(<TestComponent />);
        expect(getByText('Test Content')).toBeInTheDocument();
    });

    test('renders children in a div', () => {
        const { getByText } = render(
            <div>
                <span>Child Element</span>
            </div>
        );
        expect(getByText('Child Element')).toBeInTheDocument();
    });
});
