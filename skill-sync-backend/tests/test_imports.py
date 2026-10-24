"""Every module under app/ must import cleanly.

A module can rot when a refactor deletes something it imports and nothing
else imports it, so no other test notices. This walks the whole package.
"""

import importlib
import pkgutil

import pytest

import app

MODULES = sorted(name for _, name, _ in pkgutil.walk_packages(app.__path__, prefix="app."))


def test_package_has_modules():
    assert "app.main" in MODULES
    assert len(MODULES) > 20


@pytest.mark.parametrize("module_name", MODULES)
def test_module_imports(module_name):
    importlib.import_module(module_name)
