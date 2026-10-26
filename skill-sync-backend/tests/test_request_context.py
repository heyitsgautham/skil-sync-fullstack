"""Every request gets an ID in its logs and response, and an unhandled error becomes a logged 500."""

import io
import json
import logging

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.logging_config import configure_logging
from app.request_context import add_request_context, request_id_from


@pytest.fixture
def log_lines():
    """Capture JSON log lines for the test, then put the root logger back."""
    root = logging.getLogger()
    handlers, level = list(root.handlers), root.level
    stream = io.StringIO()
    configure_logging(level="INFO", fmt="json", stream=stream)

    def app_lines():
        lines = (json.loads(line) for line in stream.getvalue().splitlines())
        return [line for line in lines if line["logger"].startswith("app.")]

    yield app_lines
    root.handlers[:] = handlers
    root.setLevel(level)


@pytest.fixture
def small_app():
    app = FastAPI()
    add_request_context(app)

    @app.get("/ok")
    def ok():
        logging.getLogger("app.example").info("inside the handler")
        return {"ok": True}

    @app.get("/boom")
    def boom():
        raise RuntimeError("database went away")

    return TestClient(app)


def test_generates_an_id_and_puts_it_on_every_line_of_the_request(small_app, log_lines):
    response = small_app.get("/ok")

    request_id = response.headers["X-Request-ID"]
    assert len(request_id) == 32
    handler_line, access_line = log_lines()
    assert handler_line["message"] == "inside the handler"
    assert handler_line["request_id"] == access_line["request_id"] == request_id
    assert access_line["logger"] == "app.access"
    assert (access_line["method"], access_line["path"], access_line["status"]) == ("GET", "/ok", 200)
    assert access_line["duration_ms"] >= 0


def test_keeps_a_well_formed_caller_id(small_app, log_lines):
    response = small_app.get("/ok", headers={"X-Request-ID": "frontend-42"})

    assert response.headers["X-Request-ID"] == "frontend-42"
    assert {line["request_id"] for line in log_lines()} == {"frontend-42"}


@pytest.mark.parametrize("header", ["", "has spaces", "x" * 65, 'quote"injection', "line\nbreak"])
def test_replaces_ids_that_are_unsafe_to_log(header):
    assert request_id_from(header) != header
    assert len(request_id_from(header)) == 32


def test_unhandled_error_returns_a_500_with_the_id_and_logs_the_traceback(small_app, log_lines):
    response = small_app.get("/boom")

    assert response.status_code == 500
    body = response.json()
    assert body == {"detail": "Internal server error", "request_id": response.headers["X-Request-ID"]}
    assert "database went away" not in response.text
    error_line, access_line = log_lines()
    assert error_line["logger"] == "app.errors"
    assert error_line["request_id"] == body["request_id"]
    assert "RuntimeError: database went away" in error_line["exception"]
    assert access_line["status"] == 500


def test_the_app_returns_and_exposes_the_header(client):
    response = client.get("/api/healthcheck", headers={"Origin": "http://localhost:3000"})

    assert response.headers["X-Request-ID"]
    assert "X-Request-ID" in response.headers["Access-Control-Expose-Headers"]
