import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/** Render a page at `path` inside a router, with a catch-all that shows where navigation went. */
export function renderAt(element, path = '/') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={path.split('?')[0]} element={element} />
                <Route path="*" element={<div data-testid="navigated-away" />} />
            </Routes>
        </MemoryRouter>
    );
}
