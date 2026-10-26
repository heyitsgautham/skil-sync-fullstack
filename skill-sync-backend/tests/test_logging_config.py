"""configure_logging sets the level and the output format for stdlib and structlog loggers."""

import io
import json
import logging

import pytest

from app.logging_config import bind_context, clear_context, configure_logging, get_logger


@pytest.fixture(autouse=True)
def restore_root_logger():
    root = logging.getLogger()
    handlers, level = list(root.handlers), root.level
    yield
    clear_context()
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


def test_structlog_fields_land_as_json_keys():
    stream = io.StringIO()
    configure_logging(fmt="json", stream=stream)
    get_logger("app.ranking").info("ranked candidates", internship_id=7, count=3)

    record = json.loads(stream.getvalue().strip())
    assert record["message"] == "ranked candidates"
    assert record["logger"] == "app.ranking"
    assert record["level"] == "INFO"
    assert (record["internship_id"], record["count"]) == (7, 3)


def test_bound_context_reaches_stdlib_and_structlog_lines_until_cleared():
    stream = io.StringIO()
    configure_logging(fmt="json", stream=stream)

    bind_context(request_id="req-123")
    logging.getLogger("app.example").info("from stdlib")
    get_logger("app.example").info("from structlog")
    clear_context()
    logging.getLogger("app.example").info("after the request")

    first, second, third = (json.loads(line) for line in stream.getvalue().splitlines())
    assert first["request_id"] == second["request_id"] == "req-123"
    assert "request_id" not in third


def test_plain_format_appends_fields_as_key_value_pairs():
    stream = io.StringIO()
    configure_logging(fmt="plain", stream=stream)
    get_logger("app.example").warning("slow query", ms=812)

    assert "WARNING app.example: slow query ms=812" in stream.getvalue()


def test_warnings_logged_while_the_app_imports_use_the_configured_format(tmp_path):
    """Services warn at import time (no S3 keys, no Gemini keys); those lines must be JSON too."""
    import os
    import subprocess
    import sys
    from pathlib import Path

    env = {
        **os.environ,
        "LOG_FORMAT": "json",
        "DATABASE_URL": f"sqlite:///{tmp_path / 'startup.db'}",
        "AWS_ACCESS_KEY_ID": "",
        "AWS_SECRET_ACCESS_KEY": "",
    }
    result = subprocess.run(
        [sys.executable, "-W", "ignore", "-c", "import app.main"],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )

    assert result.returncode == 0, result.stderr
    app_lines = [line for line in result.stderr.splitlines() if "S3 credentials" in line or "app.main" in line]
    assert app_lines, result.stderr
    for line in app_lines:
        assert json.loads(line)["logger"].startswith("app.")
