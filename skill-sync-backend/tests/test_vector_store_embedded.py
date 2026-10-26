"""The app runs ChromaDB embedded, never as a client of a Chroma server.

CI ignores four chromadb advisories (PYSEC-2026-311, -3813, -3814, -3815) because each one is reached
through Chroma's HTTP server API. That reasoning holds only while no code talks to a Chroma server.
"""

import re
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SERVER_CLIENTS = re.compile(r"\b(HttpClient|AsyncHttpClient|CloudClient|chroma_server_host|chroma_api_impl)\b")


def test_only_the_embedded_persistent_client_is_used():
    sources = list((BACKEND / "app").rglob("*.py")) + list((BACKEND / "scripts").rglob("*.py"))
    offenders = [str(path.relative_to(BACKEND)) for path in sources if SERVER_CLIENTS.search(path.read_text())]

    assert offenders == []
    assert "chromadb.PersistentClient(" in (BACKEND / "app" / "services" / "rag_engine.py").read_text()


def test_compose_runs_no_chroma_server():
    compose = (BACKEND.parent / "docker-compose.yml").read_text()

    assert "chroma" not in compose.lower()
