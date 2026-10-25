"""
Internship API Routes
"""

# Importing each module registers its routes on the shared router. The order matters:
# /list, /my-posts and /match must register before /{internship_id} would capture them.
from app.routes.internship import authoring, listing, manage, applications  # noqa: F401, I001
from app.routes.internship.common import router

__all__ = ["router"]
