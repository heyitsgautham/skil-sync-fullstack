"""GET /api/metrics exposes request counts and latencies in the Prometheus text format."""

import re

from app.models.user import UserRole


def sample(text, name, **labels):
    """Return the value of one Prometheus sample, or 0 when it is absent."""
    wanted = ",".join(f'{key}="{value}"' for key, value in labels.items())
    match = re.search(rf"^{name}\{{{re.escape(wanted)}\}} (\S+)$", text, re.M)
    return float(match.group(1)) if match else 0.0


def test_counts_requests_by_route_template_and_status(client, make_user, auth_headers):
    headers = auth_headers(make_user(role=UserRole.student))
    route = "/api/internship/{internship_id}"
    before = client.get("/api/metrics").text
    found_before = sample(before, "skillsync_http_requests_total", method="GET", route=route, status="404")

    client.get("/api/internship/987654", headers=headers)
    client.get("/api/internship/123456", headers=headers)
    after = client.get("/api/metrics")

    assert after.status_code == 200
    assert after.headers["content-type"].startswith("text/plain")
    found_after = sample(after.text, "skillsync_http_requests_total", method="GET", route=route, status="404")
    assert found_after == found_before + 2
    assert "987654" not in after.text
    assert sample(after.text, "skillsync_http_request_duration_seconds_count", method="GET", route=route) >= 2


def test_paths_no_route_matched_share_one_label(client):
    before = sample(
        client.get("/api/metrics").text, "skillsync_http_requests_total", method="GET", route="unmatched", status="404"
    )

    client.get("/api/no-such-thing-1")
    client.get("/api/no-such-thing-2")
    text = client.get("/api/metrics").text

    assert "no-such-thing" not in text
    assert sample(text, "skillsync_http_requests_total", method="GET", route="unmatched", status="404") == before + 2


def test_metrics_endpoint_stays_out_of_the_api_docs(client):
    from app.main import app

    assert "/api/metrics" not in client.get(app.openapi_url).json()["paths"]
