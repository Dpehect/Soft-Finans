from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.api.deps import get_db
from backend.api.routes.wallet import router
from backend.auth.jwt import create_access_token
from backend.auth.middleware import AuthMiddleware
from backend.models.crypto_token import CryptoToken
from backend.models.user import User, UserRole
from backend.shared.db import Base

PASSWORD = "StrongPass!123"


def _build_app() -> tuple[FastAPI, sessionmaker]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    app = FastAPI()
    app.add_middleware(AuthMiddleware)
    app.include_router(router)
    app.state.db_session_factory = SessionLocal

    def _get_db_override():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db_override
    return app, SessionLocal


def _token(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.email, user.role.value)}"}


def test_deposit_requires_admin_approval_before_credit() -> None:
    app, SessionLocal = _build_app()
    db: Session = SessionLocal()
    try:
        user = User(id="wallet-user", email="user@example.com", hashed_password="", role=UserRole.VIEWER)
        admin = User(id="wallet-admin", email="admin@example.com", hashed_password="", role=UserRole.ADMIN)
        db.add_all([user, admin, CryptoToken(id="UMY", symbol="UMY", name="Umay", ticker="UMY-USD", canonical_id="CRYPTO:UMY", current_price_try=2.0)])
        db.commit()
        user_headers, admin_headers = _token(user), _token(admin)
    finally:
        db.close()

    client = TestClient(app)
    submitted = client.post("/api/wallet/deposits", headers=user_headers, json={"amount_try": "1000", "transfer_reference": "SB-DEP-001"})
    assert submitted.status_code == 201
    assert client.get("/api/wallet", headers=user_headers).json()["balances"]["TRY"] == 0.0
    assert client.get("/api/wallet/admin/deposits", headers=user_headers).status_code == 403

    approved = client.post(f"/api/wallet/admin/deposits/{submitted.json()['id']}/approve", headers=admin_headers)
    assert approved.status_code == 200
    assert client.get("/api/wallet", headers=user_headers).json()["balances"]["TRY"] == 1000.0


def test_buy_sell_and_admin_grant_use_server_ledger() -> None:
    app, SessionLocal = _build_app()
    db: Session = SessionLocal()
    try:
        user = User(id="trade-user", email="trade@example.com", hashed_password="", role=UserRole.VIEWER)
        admin = User(id="trade-admin", email="admin@example.com", hashed_password="", role=UserRole.ADMIN)
        db.add_all([user, admin, CryptoToken(id="UMY", symbol="UMY", name="Umay", ticker="UMY-USD", canonical_id="CRYPTO:UMY", current_price_try=2.0)])
        db.commit()
        user_headers, admin_headers = _token(user), _token(admin)
    finally:
        db.close()

    client = TestClient(app)
    grant_try = client.post("/api/wallet/admin/grants", headers=admin_headers, json={"email": "trade@example.com", "asset": "TRY", "amount": "100"})
    assert grant_try.status_code == 200
    bought = client.post("/api/wallet/orders", headers=user_headers, json={"side": "buy", "amount_try": "100"})
    assert bought.status_code == 200
    wallet = client.get("/api/wallet", headers=user_headers).json()
    assert wallet["balances"]["TRY"] == 0.0
    assert wallet["balances"]["UMY"] == 49.85

    sold = client.post("/api/wallet/orders", headers=user_headers, json={"side": "sell", "amount_umy": "10"})
    assert sold.status_code == 200
    final_wallet = client.get("/api/wallet", headers=user_headers).json()
    assert final_wallet["balances"]["UMY"] == 39.85
    assert final_wallet["balances"]["TRY"] == 19.94
