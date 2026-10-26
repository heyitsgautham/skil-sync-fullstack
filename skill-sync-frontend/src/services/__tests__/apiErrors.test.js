import { describeApiError, responseErrorMessage } from '../apiErrors';

test('a string detail is shown as it is', () => {
    expect(describeApiError({ detail: 'Email already registered' }, 'Failed')).toBe('Email already registered');
});

test('validation errors become one sentence without the "Value error" prefix', () => {
    const body = {
        detail: [
            { loc: ['body', 'phone'], msg: 'Value error, Phone number must have 7 to 15 digits' },
            { loc: ['body', 'email'], msg: 'value is not a valid email address' },
        ],
    };

    expect(describeApiError(body, 'Failed')).toBe(
        'Phone number must have 7 to 15 digits. value is not a valid email address',
    );
});

test('an empty or missing detail falls back', () => {
    expect(describeApiError({ detail: '' }, 'Failed')).toBe('Failed');
    expect(describeApiError({ detail: [] }, 'Failed')).toBe('Failed');
    expect(describeApiError(null, 'Failed')).toBe('Failed');
});

test('a response body that is not JSON falls back', async () => {
    const response = { json: async () => JSON.parse('<html>') };

    expect(await responseErrorMessage(response, 'Failed to update profile')).toBe('Failed to update profile');
});
