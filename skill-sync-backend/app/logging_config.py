"""Application-wide logging setup.

LOG_LEVEL picks the level (default INFO).
LOG_FORMAT=json writes one JSON object per line, for log collectors. Anything else writes plain text.
"""

import json
import logging
import os
import sys
from datetime import UTC, datetime

PLAIN_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"


class JsonFormatter(logging.Formatter):
    """Format a record as a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str | None = None, fmt: str | None = None, stream=None) -> None:
    """Install one stream handler on the root logger, replacing any handlers set before."""
    level_name = (level or os.getenv("LOG_LEVEL") or "INFO").upper()
    use_json = (fmt or os.getenv("LOG_FORMAT") or "plain").lower() == "json"

    handler = logging.StreamHandler(stream or sys.stderr)
    handler.setFormatter(JsonFormatter() if use_json else logging.Formatter(PLAIN_FORMAT))

    root = logging.getLogger()
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)
    root.setLevel(getattr(logging, level_name, logging.INFO))
