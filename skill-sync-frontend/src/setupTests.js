// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router 7 needs TextEncoder, which the jsdom 16 bundled with react-scripts 5 lacks.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// jsdom has no canvas. Return null like a browser that cannot create a context,
// instead of letting jsdom print a "Not implemented" error for every render.
HTMLCanvasElement.prototype.getContext = () => null;
