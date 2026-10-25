// Manual mock for the shared axios client. testUtils/backend.js routes these calls.
const apiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
};

export default apiClient;
