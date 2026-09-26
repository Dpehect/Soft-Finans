from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.auth.firebase import verify_firebase_token
from backend.auth.roles import role_for_email
from backend.models.user import User, UserRole

security = HTTPBearer(auto_error=False)

_ROLE_RANK = {
    UserRole.VIEWER.value: 1,
    UserRole.TRADER.value: 2,
    UserRole.ADMIN.value: 3,
}

def _get_or_create_firebase_user(db: Session, uid: str, email: str) -> User:
    """Look up the local User row by Firebase UID, creating it on first login."""
    user = db.query(User).filter(User.id == uid).first()
    target_role = role_for_email(email)

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
    elif user.role != target_role:
        user.role = target_role
        db.commit()
        db.refresh(user)
    return user


def _get_or_create_anonymous_user(db: Session) -> User:
    user = db.query(User).filter(User.id == "anonymous").first()
    if user is None:
        user = User(
            id="anonymous",
            email="anonymous@local",
            hashed_password="",
            role=UserRole.VIEWER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _fallback_unauthenticated_user(db: Session) -> User:
    return _get_or_create_anonymous_user(db)


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
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            ) from exc

    user = _fallback_unauthenticated_user(db)
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


def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.id == "anonymous":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return current_user


def auth_exempt_path(path: str) -> bool:
    exempt_prefixes = ("/api/auth/login", "/api/auth/register", "/health", "/docs", "/openapi")
    return any(path.startswith(p) for p in exempt_prefixes)
