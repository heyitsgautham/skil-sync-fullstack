"""Prometheus metrics for HTTP traffic, served at GET /api/metrics.

Requests are labeled by method, the route template (such as /api/internship/{internship_id}) and the
status code. Labeling by template rather than the raw path keeps the number of series bounded, and
paths no route matched share the label "unmatched".
"""

from fastapi import APIRouter, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Histogram, generate_latest

registry = CollectorRegistry()

REQUESTS = Counter(
    "skillsync_http_requests_total",
    "HTTP requests handled, by method, route template and status code",
    ["method", "route", "status"],
    registry=registry,
)
LATENCY = Histogram(
    "skillsync_http_request_duration_seconds",
    "Time to produce a response, by method and route template",
    ["method", "route"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30),
    registry=registry,
)

router = APIRouter()


def route_template(request: Request) -> str:
    """The matched route's template with its include prefix, such as /api/internship/{internship_id}.

    FastAPI keeps included routers nested, so the matched route's own path lacks the prefix it was
    included under. The prefix is the part of the request path before the route's pattern matches.
    """
    route = request.scope.get("route")
    template = getattr(route, "path", None)
    pattern = getattr(route, "path_regex", None)
    if not template or pattern is None:
        return "unmatched"
    path = request.scope.get("path", "")
    for cut in range(len(path) + 1):
        if pattern.match(path[cut:]):
            return path[:cut] + template
    return template


def observe(request: Request, status: int, seconds: float) -> None:
    route = route_template(request)
    REQUESTS.labels(request.method, route, str(status)).inc()
    LATENCY.labels(request.method, route).observe(seconds)


@router.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    return Response(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)
