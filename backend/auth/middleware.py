from __future__ import annotations

import os

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.auth.deps import auth_exempt_path
from backend.auth.jwt import decode_token
from backend.shared.db import SessionLocal
from backend.models.user import User


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_factory = getattr(request.app.state, "db_session_factory", SessionLocal)
        db = session_factory()
        try:
            from backend.auth.deps import _get_or_create_dev_user

            user = None
            auth_header = request.headers.get("Authorization", "")
            if auth_header.lower().startswith("bearer "):
                token = auth_header.split(" ", 1)[1].strip()
                try:
                    payload = decode_token(token)
                    user_id = str(payload.get("sub") or "")
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                except Exception:
                    pass

            if not user:
                user = _get_or_create_dev_user(db)
            request.state.current_user = user
        except Exception:
            from backend.models.user import UserRole
            request.state.current_user = User(
                id="dev-user",
                email="admin@openterminal.local",
                hashed_password="",
                role=UserRole.ADMIN,
            )
        finally:
            db.close()

        return await call_next(request)

