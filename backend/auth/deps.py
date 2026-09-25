from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.auth.firebase import verify_firebase_token
from backend.models.user import User, UserRole

security = HTTPBearer(auto_error=False)

_ROLE_RANK = {
    UserRole.VIEWER.value: 1,
    UserRole.TRADER.value: 2,
    UserRole.ADMIN.value: 3,
}

ADMIN_EMAILS = {
    "gurlekyunusemre2@gmail.com",
    "admin@openterminal.local",
    "admin@softbridge.local",
}


def _get_or_create_firebase_user(db: Session, uid: str, email: str) -> User:
    """Look up the local User row by Firebase UID, creating it on first login."""
    user = db.query(User).filter(User.id == uid).first()
    is_admin = (email.lower() in ADMIN_EMAILS) if email else False
    target_role = UserRole.ADMIN if is_admin else UserRole.TRADER

    if user is None:
        user = User(
            id=uid,
            email=email,
            hashed_password="",          # Firebase manages passwords
            role=target_role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif is_admin and user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
    return user


def _get_or_create_dev_user(db: Session) -> User:
    """Fallback for unauthenticated local dev calls (no Bearer token)."""
    user = db.query(User).filter(User.id == "dev-user").first()
    if user is None:
        user = User(
            id="dev-user",
            email="admin@openterminal.local",
            hashed_password="",
            role=UserRole.ADMIN,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    # Return cached user for this request if already resolved
    existing = getattr(request.state, "current_user", None)
    if existing is not None:
        return existing

    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
        try:
            claims = verify_firebase_token(token)
            uid: str = claims["sub"]
            email: str = claims.get("email", "")
            user = _get_or_create_firebase_user(db, uid, email)
            request.state.current_user = user
            return user
        except Exception:
            # Firebase verification failed — fall through to dev-user in dev,
            # or raise 401 in production.
            import os
            if os.getenv("ENVIRONMENT", "development") == "production":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )

    # No valid token → dev-user fallback (development only)
    user = _get_or_create_dev_user(db)
    request.state.current_user = user
    return user


def require_role(required_role: str) -> Callable:
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        rank = _ROLE_RANK.get(current_user.role.value, 0)
        required_rank = _ROLE_RANK.get(required_role, 99)
        if rank < required_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _dep


def auth_exempt_path(path: str) -> bool:
    exempt_prefixes = ("/api/auth/login", "/api/auth/register", "/health", "/docs", "/openapi")
    return any(path.startswith(p) for p in exempt_prefixes)
