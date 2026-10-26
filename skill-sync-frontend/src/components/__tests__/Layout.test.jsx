import React from 'react';
import { screen } from '@testing-library/react';
import Layout from '../Layout';
import { signIn, student } from '../../testUtils/backend';
import { renderAt } from '../../testUtils/render';

beforeEach(() => localStorage.clear());

test('the main area can shrink below its widest child, so phones do not scroll sideways', () => {
    signIn(student);
    renderAt(
        <Layout>
            <p>Page body</p>
        </Layout>,
        '/dashboard',
    );

    expect(screen.getByRole('main')).toHaveStyle({ minWidth: '0' });
});
