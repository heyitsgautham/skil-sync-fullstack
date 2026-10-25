// Manual mock for the shared axios client. testUtils/backend.js routes these calls.
const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
};

export default apiClient;
