"""
Health check endpoint tests - Minimal smoke tests for CI
"""

from fastapi import status


def test_root_endpoint(client):
    """Test root endpoint returns welcome message"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data


def test_health_module_imports():
    """Test that health module imports successfully"""
    from app.routes import health

    assert health is not None


def test_healthcheck_reports_a_connected_database(client):
    response = client.get("/api/healthcheck")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "connected"


def test_healthcheck_returns_503_without_leaking_the_database_error(client, caplog):
    from sqlalchemy.exc import OperationalError

    from app.database.connection import get_db
    from app.main import app

    class DeadSession:
        def execute(self, *args, **kwargs):
            raise OperationalError("SELECT 1", {}, Exception('connection to "db.internal" port 5432 refused'))

    app.dependency_overrides[get_db] = lambda: DeadSession()
    response = client.get("/api/healthcheck")

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json()["status"] == "unhealthy"
    assert response.json()["database"] == "unavailable"
    assert "db.internal" not in response.text
    assert "db.internal" in caplog.text
