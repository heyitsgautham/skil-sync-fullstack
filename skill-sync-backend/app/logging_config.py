"""Application-wide logging setup on structlog.

LOG_LEVEL picks the level (default INFO).
LOG_FORMAT=json writes one JSON object per line, for log collectors. Anything else writes plain text.

Both the stdlib loggers the app uses (logging.getLogger(__name__)) and structlog loggers go through
the same structlog processors, so every line carries the same fields. Values bound with
bind_context(), such as the request ID the request middleware sets, appear on every line logged
while they are bound.
"""

import logging
import os
import sys

import structlog

PLAIN_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"

# Processors that run for stdlib and structlog records alike, before rendering.
_SHARED_PROCESSORS = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_log_level,
    structlog.stdlib.add_logger_name,
    structlog.stdlib.ExtraAdder(),
    structlog.processors.TimeStamper(fmt="iso", utc=True, key="timestamp"),
]


def _rename_event_to_message(_, __, event_dict):
    event_dict["message"] = event_dict.pop("event", "")
    event_dict["level"] = event_dict["level"].upper()
    return event_dict


def _plain_renderer(_, __, event_dict):
    """Render "<time> <LEVEL> <logger>: <message> key=value ...", close to the old text format."""
    message = event_dict.pop("event", "")
    timestamp = event_dict.pop("timestamp", "")
    level = event_dict.pop("level", "").upper()
    name = event_dict.pop("logger", "")
    exception = event_dict.pop("exception", None)
    extras = " ".join(f"{key}={value}" for key, value in sorted(event_dict.items()))
    line = f"{timestamp} {level} {name}: {message}" + (f" {extras}" if extras else "")
    return f"{line}\n{exception}" if exception else line


def build_formatter(use_json: bool) -> logging.Formatter:
    """A stdlib formatter that renders every record through the structlog processor chain."""
    if use_json:
        final = [
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.format_exc_info,
            _rename_event_to_message,
            structlog.processors.JSONRenderer(ensure_ascii=False),
        ]
    else:
        final = [
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.format_exc_info,
            _plain_renderer,
        ]
    return structlog.stdlib.ProcessorFormatter(foreign_pre_chain=_SHARED_PROCESSORS, processors=final)


def configure_logging(level: str | None = None, fmt: str | None = None, stream=None) -> None:
    """Install one stream handler on the root logger, replacing any handlers set before."""
    level_name = (level or os.getenv("LOG_LEVEL") or "INFO").upper()
    use_json = (fmt or os.getenv("LOG_FORMAT") or "plain").lower() == "json"

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            *_SHARED_PROCESSORS,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )

    handler = logging.StreamHandler(stream or sys.stderr)
    handler.setFormatter(build_formatter(use_json))

    root = logging.getLogger()
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)
    root.setLevel(getattr(logging, level_name, logging.INFO))


def get_logger(name: str | None = None):
    """A structlog logger that accepts key-value fields: get_logger(__name__).info("ranked", count=3)."""
    return structlog.stdlib.get_logger(name)


def bind_context(**values) -> None:
    """Attach fields to every log line from this request or task until clear_context() runs."""
    structlog.contextvars.bind_contextvars(**values)


def clear_context() -> None:
    structlog.contextvars.clear_contextvars()
