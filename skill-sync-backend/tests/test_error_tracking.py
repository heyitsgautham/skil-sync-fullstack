"""Sentry starts only when SENTRY_DSN is set, and never sends personal data."""

import pytest

from app import error_tracking


@pytest.fixture
def init_calls(monkeypatch):
    calls = []
    monkeypatch.setattr(error_tracking.sentry_sdk, "init", lambda **kwargs: calls.append(kwargs))
    return calls


@pytest.mark.parametrize("environ", [{}, {"SENTRY_DSN": ""}, {"SENTRY_DSN": "   "}])
def test_does_nothing_without_a_dsn(init_calls, environ):
    assert error_tracking.init_error_tracking(environ) is False
    assert init_calls == []


def test_starts_with_the_dsn_and_without_personal_data(init_calls):
    environ = {
        "SENTRY_DSN": "https://key@sentry.example/1",
        "SENTRY_ENVIRONMENT": "staging",
        "SENTRY_TRACES_SAMPLE_RATE": "0.2",
    }

    assert error_tracking.init_error_tracking(environ) is True
    (options,) = init_calls
    assert options["dsn"] == "https://key@sentry.example/1"
    assert options["environment"] == "staging"
    assert options["traces_sample_rate"] == 0.2
    assert options["send_default_pii"] is False
    assert options["max_request_body_size"] == "never"


@pytest.mark.parametrize("value,expected", [(None, 0.0), ("abc", 0.0), ("-1", 0.0), ("7", 1.0), ("0.05", 0.05)])
def test_sample_rate_defaults_to_off_and_stays_between_0_and_1(init_calls, value, expected):
    environ = {"SENTRY_DSN": "https://key@sentry.example/1"}
    if value is not None:
        environ["SENTRY_TRACES_SAMPLE_RATE"] = value

    error_tracking.init_error_tracking(environ)

    assert init_calls[0]["traces_sample_rate"] == expected
    assert init_calls[0]["environment"] == "development"
