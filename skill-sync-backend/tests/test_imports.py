"""Every module under app/ must import cleanly, and every script's app imports must resolve.

A module can rot when a refactor deletes something it imports and nothing
else imports it, so no other test notices. This walks the whole package.
"""

import ast
import importlib
import pkgutil
from pathlib import Path

import pytest

import app

MODULES = sorted(name for _, name, _ in pkgutil.walk_packages(app.__path__, prefix="app."))


def test_package_has_modules():
    assert "app.main" in MODULES
    assert len(MODULES) > 20


@pytest.mark.parametrize("module_name", MODULES)
def test_module_imports(module_name):
    importlib.import_module(module_name)


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"


def _project_imports(path):
    """Yield (line, module, name) for each `from app...` or `from scripts...` import in a script."""
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.ImportFrom) and node.module and node.module.split(".")[0] in ("app", "scripts"):
            for alias in node.names:
                yield node.lineno, node.module, alias.name


@pytest.mark.parametrize("script", sorted(SCRIPTS_DIR.rglob("*.py")), ids=lambda p: p.name)
def test_script_imports_resolve(script):
    """Scripts run by hand, so nothing else notices when one imports a name the app no longer has.

    Importing a script would run it, so this resolves each of its app imports instead.
    """
    missing = []
    for line, module_name, name in _project_imports(script):
        module = importlib.import_module(module_name)
        if not hasattr(module, name):
            try:
                importlib.import_module(f"{module_name}.{name}")
            except ImportError:
                missing.append(f"line {line}: {module_name}.{name}")
    assert missing == []
