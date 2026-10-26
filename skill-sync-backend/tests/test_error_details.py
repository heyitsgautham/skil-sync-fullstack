"""A 500 tells the user what failed, never the exception text behind it.

Exception text carries database hosts, SQL, file paths and API responses. The handlers used to
append it to the response detail; the server log keeps it now, tagged with the request ID.
"""

import ast
from pathlib import Path

from sqlalchemy.exc import OperationalError

from app.models.user import UserRole

SECRET = 'connection to server at "db.internal.example" (10.0.0.7), port 5432 failed'


def boom(*args, **kwargs):
    raise OperationalError("SELECT users.id FROM users", {}, Exception(SECRET))


def test_login_failure_hides_the_database_error(client, monkeypatch, caplog):
    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "authenticate_user", boom)

    response = client.post("/api/auth/login", json={"email": "asha@example.com", "password": "password123"})

    assert response.status_code == 500
    assert response.json()["detail"] == "Login failed"
    assert "db.internal" not in response.text
    assert "db.internal" in caplog.text


def test_admin_user_list_failure_hides_the_database_error(client, make_user, auth_headers, monkeypatch):
    from sqlalchemy.orm import Query

    headers = auth_headers(make_user(role=UserRole.admin))
    monkeypatch.setattr(Query, "all", boom)

    response = client.get("/api/auth/users", headers=headers)

    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to fetch users"
    assert "SELECT" not in response.text


def _builds_detail_from_exception(call: ast.Call) -> bool:
    """True for HTTPException(..., detail=<anything that reads the caught exception>)."""
    for keyword in call.keywords:
        if keyword.arg == "detail":
            return any(isinstance(node, ast.Name) and node.id == "e" for node in ast.walk(keyword.value))
    return False


def _status_is_500(call: ast.Call) -> bool:
    for keyword in call.keywords:
        if keyword.arg == "status_code":
            text = ast.unparse(keyword.value)
            return text in ("500", "status.HTTP_500_INTERNAL_SERVER_ERROR")
    return False


def test_no_route_puts_exception_text_in_a_500():
    routes = Path(__file__).resolve().parents[1] / "app" / "routes"
    offenders = []
    for path in sorted(routes.rglob("*.py")):
        for node in ast.walk(ast.parse(path.read_text())):
            if (
                isinstance(node, ast.Call)
                and getattr(node.func, "id", None) == "HTTPException"
                and _status_is_500(node)
                and _builds_detail_from_exception(node)
            ):
                offenders.append(f"{path.relative_to(routes)}:{node.lineno}")
    assert offenders == []
