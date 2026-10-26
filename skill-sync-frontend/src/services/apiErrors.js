/**
 * Turn an error response body from the API into one sentence a person can act on.
 *
 * FastAPI sends `detail` as a string for errors a route raises, and as a list of
 * `{ loc, msg }` objects when request validation fails.
 */
export function describeApiError(body, fallback) {
    const detail = body?.detail;
    if (typeof detail === 'string' && detail) {
        return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((item) => String(item?.msg ?? item).replace(/^Value error, /, '')).join('. ');
    }
    return fallback;
}

/** The reason a failed fetch() response gives, or `fallback` when its body says nothing usable. */
export async function responseErrorMessage(response, fallback) {
    try {
        return describeApiError(await response.json(), fallback);
    } catch {
        return fallback;
    }
}
