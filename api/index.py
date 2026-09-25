from __future__ import annotations

import os
import sys

# Ensure repository root is on sys.path so 'backend' is importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Configure Vercel serverless environment flags
os.environ.setdefault("VERCEL", "1")
os.environ.setdefault("AUTH_MIDDLEWARE_ENABLED", "0")
os.environ.setdefault("OPENTERMINALUI_INSTRUMENT_AUTOSEED", "0")
os.environ.setdefault("OPENTERMINALUI_PREFETCH_ENABLED", "0")
os.environ.setdefault("OPENTERMINALUI_ENV", "production")

from backend.main import app

# Export for Vercel ASGI serverless handler
handler = app
