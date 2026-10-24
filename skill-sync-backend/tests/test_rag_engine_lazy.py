"""Tests for the lazily built shared RAG engine."""

import threading

import pytest

from app.services import rag_engine as rag_module
from app.services.rag_engine import LazyRAGEngine


class FakeEngine:
    instances = 0

    def __init__(self):
        FakeEngine.instances += 1
        self.marker = "fake"

    def generate_embedding(self, text):
        return [float(len(text))]


def setup_function():
    FakeEngine.instances = 0


def test_importing_app_does_not_build_the_engine():
    import app.main  # noqa: F401

    assert isinstance(rag_module.rag_engine, LazyRAGEngine)
    assert not rag_module.rag_engine.is_initialized


def test_engine_is_built_on_first_attribute_access():
    lazy = LazyRAGEngine(factory=FakeEngine)
    assert FakeEngine.instances == 0
    assert not lazy.is_initialized

    assert lazy.generate_embedding("abc") == [3.0]
    assert FakeEngine.instances == 1
    assert lazy.is_initialized


def test_engine_is_built_once_and_shared():
    lazy = LazyRAGEngine(factory=FakeEngine)

    first = lazy.get()
    assert lazy.marker == "fake"
    assert lazy.get() is first
    assert FakeEngine.instances == 1


def test_concurrent_first_access_builds_one_engine():
    lazy = LazyRAGEngine(factory=FakeEngine)
    results = []

    def worker():
        results.append(lazy.get())

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert FakeEngine.instances == 1
    assert all(r is results[0] for r in results)


def test_missing_attribute_raises_attribute_error():
    lazy = LazyRAGEngine(factory=FakeEngine)
    with pytest.raises(AttributeError):
        _ = lazy.does_not_exist
