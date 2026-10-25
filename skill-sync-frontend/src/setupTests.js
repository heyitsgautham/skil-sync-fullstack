import '@testing-library/jest-dom/vitest';

// jsdom has no canvas. Return null like a browser that cannot create a context,
// instead of letting jsdom print a "Not implemented" error for every render.
HTMLCanvasElement.prototype.getContext = () => null;
