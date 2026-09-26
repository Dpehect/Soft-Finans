from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.auth.deps import _fallback_unauthenticated_user, auth_exempt_path, _get_or_create_firebase_user
from backend.auth.firebase import verify_firebase_token
from backend.auth.jwt import decode_token
from backend.shared.db import SessionLocal
from backend.models.user import User, UserRole

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if auth_exempt_path(request.url.path):
            return await call_next(request)

        session_factory = getattr(request.app.state, "db_session_factory", SessionLocal)
        db = session_factory()
        try:
            user = None
            auth_header = request.headers.get("Authorization", "")
            if auth_header.lower().startswith("bearer "):
                token = auth_header.split(" ", 1)[1].strip()
                try:
                    claims = verify_firebase_token(token)
                    uid = str(claims.get("sub") or "")
                    email = str(claims.get("email") or "")
                    if uid:
                        user = _get_or_create_firebase_user(db, uid, email)
                except Exception:
                    try:
                        payload = decode_token(token)
                        if payload.get("type") != "access":
                            raise ValueError("Token is not an access token")
                        user_id = str(payload.get("sub") or "")
                        if user_id:
                            user = db.query(User).filter(User.id == user_id).first()
                    except Exception:
                        user = None

            if not user:
                if auth_header.lower().startswith("bearer "):
                    return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})
                user = _fallback_unauthenticated_user(db)

            request.state.current_user = user
        except Exception:
            request.state.current_user = User(
                id="anonymous",
                email="anonymous@local",
                hashed_password="",
                role=UserRole.VIEWER,
            )
        finally:
            db.close()

        return await call_next(request)
