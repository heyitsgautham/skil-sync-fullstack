"""CORS origins come from ALLOWED_ORIGINS."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from app.main import parse_allowed_origins


def test_unset_or_blank_allows_every_origin():
    assert parse_allowed_origins(None) == ["*"]
    assert parse_allowed_origins("") == ["*"]
    assert parse_allowed_origins(" , ") == ["*"]


def test_splits_and_trims_a_comma_separated_list():
    assert parse_allowed_origins("http://localhost:3000, https://app.example.com ,") == [
        "http://localhost:3000",
        "https://app.example.com",
    ]


def _client(origins: list[str]) -> TestClient:
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
    )

    @app.get("/ping")
    def ping():
        return {"ok": True}

    return TestClient(app)


def test_listed_origin_gets_cors_headers():
    client = _client(parse_allowed_origins("http://localhost:3000"))
    response = client.get("/ping", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unlisted_origin_gets_no_cors_headers():
    client = _client(parse_allowed_origins("http://localhost:3000"))
    response = client.get("/ping", headers={"Origin": "https://evil.example.com"})
    assert "access-control-allow-origin" not in response.headers


def test_app_reads_allowed_origins_from_the_environment():
    import os

    from app.main import app

    cors = next(m for m in app.user_middleware if m.cls is CORSMiddleware)
    assert cors.kwargs["allow_origins"] == parse_allowed_origins(os.getenv("ALLOWED_ORIGINS"))
