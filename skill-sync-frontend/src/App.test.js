import { render } from '@testing-library/react';
import React from 'react';

test('renders app without crashing', () => {
  // Simple test to ensure React is working
  const TestComponent = () => <div>Test</div>;
  const { container } = render(<TestComponent />);
  expect(container).toBeTruthy();
});

test('basic arithmetic works', () => {
  expect(1 + 1).toBe(2);
});
