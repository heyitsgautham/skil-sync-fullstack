"""The /api/filter route table, so moving handlers between modules cannot drop or rename one."""

from app.main import app

EXPECTED = {
    ("POST", "/api/filter/parse-resume"),
    ("POST", "/api/filter/rank-candidates/{internship_id}"),
    ("GET", "/api/filter/flagged-candidates-details"),
    ("GET", "/api/filter/candidate-profile/{student_id}"),
    ("POST", "/api/filter/match-score"),
    ("POST", "/api/filter/compute-matches"),
    ("GET", "/api/filter/rank-candidates/{internship_id}/filtered"),
    ("GET", "/api/filter/export-candidates/{internship_id}"),
}


def test_filter_routes_are_all_registered_once():
    # FastAPI 0.16x keeps included routers lazy, so read the routes from the OpenAPI schema.
    paths = app.openapi()["paths"]
    routes = [
        (method.upper(), path)
        for path, operations in paths.items()
        if path.startswith("/api/filter")
        for method in operations
    ]
    assert sorted(routes) == sorted(EXPECTED)
