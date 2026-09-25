"""
Firebase ID token verification for the backend.

We verify tokens manually against Google's public keys (RS256) without
the firebase-admin SDK — which avoids a heavyweight dependency and works
fine with Python 3.14.

Flow:
  1. Frontend obtains a Firebase ID token via getIdToken().
  2. Token is sent as "Authorization: Bearer <token>" on every API call.
  3. This module verifies the token signature + claims, then returns the
     Firebase UID and email so we can look up / create a local User row.
"""
from __future__ import annotations

import time
from functools import lru_cache
from typing import Any

import httpx
from jose import JWTError, jwt

GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)
FIREBASE_PROJECT_ID = "coinradar-f0728"


@lru_cache(maxsize=1)
def _get_google_certs_cached(cache_bust: int) -> dict[str, str]:
    """Fetch Google's RSA public keys, cached for ~1 h (cache_bust = hour bucket)."""
    resp = httpx.get(GOOGLE_CERTS_URL, timeout=10)
    resp.raise_for_status()
    return resp.json()  # type: ignore[return-value]


def _get_google_certs() -> dict[str, str]:
    # Bust the lru_cache every hour so stale keys don't cause 401 floods.
    hour_bucket = int(time.time()) // 3600
    return _get_google_certs_cached(hour_bucket)


def verify_firebase_token(id_token: str) -> dict[str, Any]:
    """Verify a Firebase ID token and return its decoded claims.

    Raises ValueError on any verification failure.
    """
    try:
        unverified_header = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise ValueError(f"Could not decode token header: {exc}") from exc

    kid = unverified_header.get("kid")
    certs = _get_google_certs()

    if kid not in certs:
        raise ValueError(f"Unknown key ID: {kid}")

    public_key = certs[kid]

    try:
        claims: dict[str, Any] = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            options={"verify_exp": True},
        )
    except JWTError as exc:
        raise ValueError(f"Token verification failed: {exc}") from exc

    if claims.get("iss") != f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}":
        raise ValueError("Invalid token issuer")

    return claims
