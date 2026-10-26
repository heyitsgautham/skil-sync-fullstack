"""Turn an unexpected exception inside a route into a 500 that does not leak its details."""

import logging

from fastapi import HTTPException, status

_log = logging.getLogger("app.errors")


def internal_error(message: str) -> HTTPException:
    """Log the exception being handled with its traceback, and return a 500 that names only what failed.

    Call it inside an except block: `raise internal_error("Login failed")`. The log line carries the
    request ID, so the full error can be found from the ID the client received.
    """
    _log.exception(message)
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=message)
