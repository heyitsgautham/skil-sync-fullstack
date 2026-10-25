"""Small text helpers shared by the skill extractors."""

import re


def mentions_word(pattern: str, text: str) -> bool:
    """True when pattern appears in text as a whole word, so "r" does not match "docker".

    Both arguments should already be lowercase. Symbols inside the pattern, as in
    "c++" or "node.js", match literally.
    """
    return re.search(rf"(?<![a-z0-9]){re.escape(pattern)}(?![a-z0-9])", text) is not None
