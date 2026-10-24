"""configure_logging sets the level and the output format."""

import io
import json
import logging

import pytest

from app.logging_config import configure_logging


@pytest.fixture(autouse=True)
def restore_root_logger():
    root = logging.getLogger()
    handlers, level = list(root.handlers), root.level
    yield
    root.handlers[:] = handlers
    root.setLevel(level)


def test_json_format_writes_one_object_per_line():
    stream = io.StringIO()
    configure_logging(level="INFO", fmt="json", stream=stream)
    logging.getLogger("app.example").info("ranked %d candidates", 3)

    record = json.loads(stream.getvalue().strip())
    assert record["level"] == "INFO"
    assert record["logger"] == "app.example"
    assert record["message"] == "ranked 3 candidates"
    assert "timestamp" in record


def test_json_format_includes_the_exception():
    stream = io.StringIO()
    configure_logging(fmt="json", stream=stream)
    try:
        raise ValueError("bad resume")
    except ValueError:
        logging.getLogger("app.example").exception("parse failed")

    record = json.loads(stream.getvalue().strip())
    assert "ValueError: bad resume" in record["exception"]


def test_plain_format_and_level_filtering():
    stream = io.StringIO()
    configure_logging(level="WARNING", fmt="plain", stream=stream)
    log = logging.getLogger("app.example")
    log.info("hidden")
    log.warning("shown")

    output = stream.getvalue()
    assert "hidden" not in output
    assert "WARNING app.example: shown" in output


def test_reads_level_and_format_from_the_environment(monkeypatch):
    monkeypatch.setenv("LOG_LEVEL", "debug")
    monkeypatch.setenv("LOG_FORMAT", "json")
    stream = io.StringIO()
    configure_logging(stream=stream)
    logging.getLogger("app.example").debug("visible at debug")

    assert json.loads(stream.getvalue().strip())["level"] == "DEBUG"


def test_calling_twice_keeps_a_single_handler():
    configure_logging(stream=io.StringIO())
    configure_logging(stream=io.StringIO())
    assert len(logging.getLogger().handlers) == 1
