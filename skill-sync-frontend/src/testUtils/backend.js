/**
 * A fake backend for page tests.
 *
 * Pages reach the API three ways: the shared apiClient from services/api, the axios default export,
 * and window.fetch. `fakeBackend` answers all three from one route table, records every call, and
 * fails the request for any route the test did not declare.
 *
 * Each test file must mock services/api with `vi.mock('../../services/api')` (relative to the test),
 * which picks up the manual mock in services/__mocks__/api.js.
 */
import axios from 'axios';
import apiClient from '../services/api';
import { API_BASE_URL } from '../services/apiConfig';

const METHODS = ['get', 'post', 'put', 'delete'];

const pathOf = (url) => {
    const withoutBase = url.startsWith(API_BASE_URL) ? url.slice(API_BASE_URL.length) : url;
    return withoutBase.split('?')[0];
};

export function fakeBackend(routes) {
    const calls = [];

    const respond = (method, url, body, config) => {
        const path = pathOf(url);
        calls.push({ method, path, url, body, params: config?.params });
        const route = routes.find(
            ([m, pattern]) => m === method && (typeof pattern === 'string' ? pattern === path : pattern.test(path)),
        );
        if (!route) {
            return Promise.reject({ response: { status: 404, data: { detail: `No fake for ${method} ${path}` } } });
        }
        const handler = route[2];
        const result = typeof handler === 'function' ? handler({ path, body, params: config?.params }) : handler;
        if (result && result.__error) {
            return Promise.reject({ response: { status: result.status, data: result.data } });
        }
        if (result && result.__withHeaders) {
            return Promise.resolve({ data: result.data, status: 200, headers: result.headers });
        }
        return Promise.resolve({ data: result, status: 200, headers: {} });
    };

    METHODS.forEach((method) => {
        const handler = (url, a, b) =>
            method === 'get' || method === 'delete' ? respond(method, url, undefined, a) : respond(method, url, a, b);
        vi.spyOn(axios, method).mockImplementation(handler);
        apiClient[method].mockImplementation(handler);
    });

    global.fetch = vi.fn((url, options = {}) => {
        const method = (options.method || 'GET').toLowerCase();
        let body = options.body;
        try {
            body = body ? JSON.parse(body) : undefined;
        } catch (e) {
            // FormData and other bodies pass through untouched
        }
        return respond(method, url, body).then(
            ({ data }) => ({ ok: true, status: 200, json: async () => data, blob: async () => new Blob([]) }),
            ({ response }) => ({ ok: false, status: response.status, json: async () => response.data }),
        );
    });

    return calls;
}

export const fail = (status, detail) => ({ __error: true, status, data: { detail } });

/** A response that also carries headers, such as the content-type of a file. */
export const withHeaders = (data, headers) => ({ __withHeaders: true, data, headers });

export function signIn(user) {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(user));
}

export const student = { id: 11, email: 'asha@example.com', full_name: 'Asha Raman', role: 'student' };
export const company = { id: 21, email: 'hr@acme.test', full_name: 'Acme Labs', role: 'company' };
export const admin = { id: 1, email: 'admin@skillsync.test', full_name: 'Site Admin', role: 'admin' };
