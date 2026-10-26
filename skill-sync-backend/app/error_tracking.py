"""Optional error tracking with Sentry.

Set SENTRY_DSN to report unhandled exceptions and error-level log lines to Sentry. Without it this
module does nothing and the app sends no data anywhere.

SENTRY_ENVIRONMENT names the deployment (default "development").
SENTRY_TRACES_SAMPLE_RATE samples performance traces between 0 and 1 (default 0, off).
Request bodies, cookies and user IPs are never sent, because resumes and contact details pass through.
"""

import logging
import os

import sentry_sdk

logger = logging.getLogger(__name__)


def _sample_rate(value: str | None) -> float:
    try:
        rate = float(value) if value else 0.0
    except ValueError:
        logger.warning("SENTRY_TRACES_SAMPLE_RATE=%r is not a number, so tracing stays off", value)
        return 0.0
    return min(max(rate, 0.0), 1.0)


def init_error_tracking(environ=os.environ) -> bool:
    """Start Sentry when SENTRY_DSN is set. Returns whether it started."""
    dsn = (environ.get("SENTRY_DSN") or "").strip()
    if not dsn:
        return False
    sentry_sdk.init(
        dsn=dsn,
        environment=environ.get("SENTRY_ENVIRONMENT") or "development",
        traces_sample_rate=_sample_rate(environ.get("SENTRY_TRACES_SAMPLE_RATE")),
        send_default_pii=False,
        max_request_body_size="never",
    )
    logger.info("Error tracking enabled")
    return True
