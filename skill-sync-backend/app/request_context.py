"""Per-request logging context: a request ID, an access log line and a last-resort error handler.

Every request gets an ID, taken from a well-formed X-Request-ID header or generated. The ID is bound
to the logging context, so every line logged while the request runs carries it, and it is returned
in the X-Request-ID response header so a user's report can be matched to the server logs.
"""

import re
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.logging_config import bind_context, clear_context, get_logger

REQUEST_ID_HEADER = "X-Request-ID"
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")

access_log = get_logger("app.access")
error_log = get_logger("app.errors")


def request_id_from(header_value: str | None) -> str:
    """Keep a caller's request ID when it is safe to log, otherwise make a new one."""
    if header_value and _VALID_REQUEST_ID.match(header_value):
        return header_value
    return uuid.uuid4().hex


def add_request_context(app: FastAPI) -> None:
    """Install the request ID, access log and unhandled-error middleware on app."""

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request_id_from(request.headers.get(REQUEST_ID_HEADER))
        clear_context()
        bind_context(request_id=request_id)
        started = time.perf_counter()
        try:
            try:
                response = await call_next(request)
            except Exception:
                error_log.exception("unhandled error", method=request.method, path=request.url.path)
                response = JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error", "request_id": request_id},
                )
            response.headers[REQUEST_ID_HEADER] = request_id
            access_log.info(
                "request",
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                duration_ms=round((time.perf_counter() - started) * 1000, 1),
            )
            return response
        finally:
            clear_context()
