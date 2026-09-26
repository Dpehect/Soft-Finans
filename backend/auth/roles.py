from __future__ import annotations

import os

from backend.models.user import UserRole


def normalize_email(email: str) -> str:
    return email.strip().lower()


def configured_admin_emails() -> frozenset[str]:
    """Return the server-only allowlist for administrator accounts."""
    raw = os.getenv("ADMIN_EMAILS", "")
    return frozenset(
        normalized
        for value in raw.split(",")
        if (normalized := normalize_email(value))
    )


def role_for_email(email: str) -> UserRole:
    return UserRole.ADMIN if normalize_email(email) in configured_admin_emails() else UserRole.VIEWER
