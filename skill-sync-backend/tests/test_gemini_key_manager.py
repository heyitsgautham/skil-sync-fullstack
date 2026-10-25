"""GeminiKeyManager key priority, rotation and response checks, with a fake genai.Client."""

import pytest

from app.utils import gemini_key_manager as gkm
from app.utils.gemini_key_manager import GeminiKeyManager


class FakeResponse:
    def __init__(self, text="ok", finish_reason=None):
        self.text = text
        self.candidates = [type("Candidate", (), {"finish_reason": finish_reason, "safety_ratings": []})()]


class FakeClient:
    """Behaviour per API key: "ok", or an exception message to raise on every call."""

    behaviour = {}
    calls = []
    reply = FakeResponse("generated text")

    def __init__(self, api_key):
        self.api_key = api_key
        self.models = self

    def generate_content(self, model, contents, config):
        FakeClient.calls.append((self.api_key, contents))
        outcome = FakeClient.behaviour.get(self.api_key, "ok")
        if outcome != "ok":
            raise RuntimeError(outcome)
        return FakeClient.reply if contents != "Say OK" else FakeResponse("OK")

    def generate_content_stream(self, model, contents, config):
        for piece in ["Hel", "", "lo"]:
            yield FakeResponse(piece)


@pytest.fixture
def manager(monkeypatch):
    FakeClient.behaviour = {}
    FakeClient.calls = []
    FakeClient.reply = FakeResponse("generated text")
    monkeypatch.setattr(gkm.genai, "Client", FakeClient)
    monkeypatch.setattr(gkm.time, "sleep", lambda seconds: None)
    monkeypatch.setenv("GEMINI_KEY_RESUME_PARSING", "key-parse")
    monkeypatch.setenv("GEMINI_KEY_CANDIDATE_SUMMARY", "key-summary")
    monkeypatch.setenv("GEMINI_KEY_FALLBACK_1", "key-fallback")
    return GeminiKeyManager()


def test_loads_only_the_keys_that_are_set(manager):
    assert manager.purpose_keys == {
        "resume_parsing": "key-parse",
        "candidate_summary": "key-summary",
        "fallback_1": "key-fallback",
    }


def test_priority_is_purpose_then_fallbacks_then_the_rest(manager):
    assert manager._get_key_priority_list("candidate_summary") == ["candidate_summary", "fallback_1", "resume_parsing"]
    assert manager._get_key_priority_list("unknown") == ["fallback_1", "resume_parsing", "candidate_summary"]


def test_uses_and_caches_the_purpose_key(manager):
    first = manager.get_client("resume_parsing")
    second = manager.get_client("resume_parsing")
    assert first is second
    assert first.api_key == "key-parse"


def test_rate_limited_key_rotates_to_the_fallback(manager):
    FakeClient.behaviour = {"key-parse": "429 RESOURCE_EXHAUSTED quota"}

    client = manager.get_client("resume_parsing")

    assert client.api_key == "key-fallback"
    assert "resume_parsing" in manager.failed_keys


def test_invalid_key_rotates_too(manager):
    FakeClient.behaviour = {"key-summary": "API key not valid"}
    assert manager.get_client("candidate_summary").api_key == "key-fallback"


def test_raises_after_every_key_fails(manager):
    FakeClient.behaviour = {key: "503 unavailable" for key in ("key-parse", "key-summary", "key-fallback")}
    with pytest.raises(Exception, match="All Gemini API keys failed after 1 attempts"):
        manager.get_client("resume_parsing", max_retries=1)


def test_retry_round_reuses_the_cached_client_without_retesting(manager):
    FakeClient.behaviour = {key: "503 unavailable" for key in ("key-parse", "key-summary", "key-fallback")}
    client = manager.get_client("resume_parsing", max_retries=2)
    assert client.api_key == "key-parse"
    assert [call for call in FakeClient.calls if call[1] == "Say OK"] == [
        ("key-parse", "Say OK"),
        ("key-fallback", "Say OK"),
        ("key-summary", "Say OK"),
    ]


def test_no_keys_means_no_client(monkeypatch):
    monkeypatch.setattr(gkm.genai, "Client", FakeClient)
    with pytest.raises(Exception, match="All Gemini API keys failed"):
        GeminiKeyManager().get_client(max_retries=1)


def test_generate_content_returns_stripped_text(manager):
    FakeClient.reply = FakeResponse("  answer  ")
    assert manager.generate_content("question", system_instruction="be brief") == "answer"
    assert ("key-parse", "question") in FakeClient.calls


@pytest.mark.parametrize(
    "response,message",
    [(FakeResponse("blocked", finish_reason="SAFETY"), "safety"), (FakeResponse("  "), "Empty response")],
)
def test_generate_content_rejects_blocked_or_empty_replies(manager, response, message):
    FakeClient.reply = response
    with pytest.raises(Exception, match=message):
        manager.generate_content("question")


def test_stream_skips_empty_chunks(manager):
    assert list(manager.generate_content_stream("question")) == ["Hel", "lo"]


def test_reset_failed_keys(manager):
    manager.failed_keys.add("resume_parsing")
    manager.reset_failed_keys()
    assert manager.failed_keys == set()


def test_singleton(monkeypatch):
    monkeypatch.setattr(gkm, "_key_manager", None)
    assert gkm.get_gemini_key_manager() is gkm.get_gemini_key_manager()
