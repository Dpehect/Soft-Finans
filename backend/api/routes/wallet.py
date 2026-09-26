from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_DOWN

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.auth.deps import require_authenticated_user, require_role
from backend.models.crypto_token import CryptoToken
from backend.models.user import User
from backend.models.wallet import BankDeposit, WalletBalance, WalletLedgerEntry

router = APIRouter(prefix="/api/wallet", tags=["wallet"])
_ASSETS = {"TRY", "UMY"}
_FEE_RATE = Decimal("0.003")


class DepositRequest(BaseModel):
    amount_try: str
    transfer_reference: str = Field(min_length=6, max_length=64)


class OrderRequest(BaseModel):
    side: str
    amount_try: str | None = None
    amount_umy: str | None = None


class AdminGrantRequest(BaseModel):
    email: str
    asset: str
    amount: str
    note: str | None = Field(default=None, max_length=256)


def _decimal(value: str | None, *, precision: str = "0.00000001") -> Decimal:
    try:
        amount = Decimal(value or "0").quantize(Decimal(precision), rounding=ROUND_DOWN)
    except (InvalidOperation, ValueError):
        raise HTTPException(status_code=422, detail="Invalid amount") from None
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be positive")
    return amount


def _balance(db: Session, user_id: str, asset: str) -> WalletBalance:
    row = (
        db.query(WalletBalance)
        .filter(WalletBalance.user_id == user_id, WalletBalance.asset == asset)
        .with_for_update()
        .first()
    )
    if row is None:
        row = WalletBalance(user_id=user_id, asset=asset, amount=Decimal("0"))
        db.add(row)
        db.flush()
    return row


def _post(db: Session, user_id: str, asset: str, amount: Decimal, entry_type: str, reference: str, note: str | None = None) -> None:
    balance = _balance(db, user_id, asset)
    next_amount = Decimal(balance.amount) + amount
    if next_amount < 0:
        raise HTTPException(status_code=409, detail=f"Insufficient {asset} balance")
    balance.amount = next_amount
    balance.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(WalletLedgerEntry(user_id=user_id, asset=asset, amount=amount, entry_type=entry_type, reference=reference, note=note))


def _wallet_payload(db: Session, user_id: str) -> dict:
    balances = {row.asset: float(row.amount) for row in db.query(WalletBalance).filter(WalletBalance.user_id == user_id)}
    entries = (
        db.query(WalletLedgerEntry)
        .filter(WalletLedgerEntry.user_id == user_id)
        .order_by(WalletLedgerEntry.created_at.desc())
        .limit(50)
        .all()
    )
    deposits = (
        db.query(BankDeposit)
        .filter(BankDeposit.user_id == user_id)
        .order_by(BankDeposit.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "balances": {"TRY": balances.get("TRY", 0.0), "UMY": balances.get("UMY", 0.0)},
        "entries": [
            {"id": row.id, "asset": row.asset, "amount": float(row.amount), "type": row.entry_type, "reference": row.reference, "note": row.note, "created_at": row.created_at.isoformat()}
            for row in entries
        ],
        "deposits": [
            {"id": row.id, "amount_try": float(row.amount_try), "reference": row.transfer_reference, "status": row.status, "created_at": row.created_at.isoformat()}
            for row in deposits
        ],
    }


@router.get("")
def get_wallet(current_user: User = Depends(require_authenticated_user), db: Session = Depends(get_db)) -> dict:
    return _wallet_payload(db, current_user.id)


@router.post("/deposits", status_code=status.HTTP_201_CREATED)
def create_deposit(payload: DepositRequest, current_user: User = Depends(require_authenticated_user), db: Session = Depends(get_db)) -> dict:
    amount = _decimal(payload.amount_try, precision="0.01")
    reference = payload.transfer_reference.strip().upper()
    if not reference.replace("-", "").isalnum():
        raise HTTPException(status_code=422, detail="Invalid transfer reference")
    if db.query(BankDeposit).filter(BankDeposit.transfer_reference == reference).first():
        raise HTTPException(status_code=409, detail="Transfer reference already submitted")
    deposit = BankDeposit(user_id=current_user.id, amount_try=amount, transfer_reference=reference, status="pending")
    db.add(deposit)
    db.commit()
    return {"id": deposit.id, "status": deposit.status, "amount_try": float(deposit.amount_try)}


@router.post("/orders")
def place_order(payload: OrderRequest, current_user: User = Depends(require_authenticated_user), db: Session = Depends(get_db)) -> dict:
    side = payload.side.strip().lower()
    token = db.query(CryptoToken).filter(CryptoToken.symbol == "UMY").first()
    if token is None or token.current_price_try <= 0:
        raise HTTPException(status_code=503, detail="UMY price is unavailable")
    price = Decimal(str(token.current_price_try))
    reference = f"UMY-{uuid.uuid4().hex[:12].upper()}"

    if side == "buy":
        amount_try = _decimal(payload.amount_try, precision="0.01")
        umy_amount = ((amount_try / price) * (Decimal("1") - _FEE_RATE)).quantize(Decimal("0.00000001"), rounding=ROUND_DOWN)
        _post(db, current_user.id, "TRY", -amount_try, "buy_debit", reference)
        _post(db, current_user.id, "UMY", umy_amount, "buy_credit", reference)
    elif side == "sell":
        umy_amount = _decimal(payload.amount_umy)
        amount_try = (umy_amount * price * (Decimal("1") - _FEE_RATE)).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        _post(db, current_user.id, "UMY", -umy_amount, "sell_debit", reference)
        _post(db, current_user.id, "TRY", amount_try, "sell_credit", reference)
    else:
        raise HTTPException(status_code=422, detail="Side must be buy or sell")

    db.commit()
    return {"reference": reference, "side": side, "price_try": float(price), "amount_try": float(amount_try), "amount_umy": float(umy_amount), "fee_rate": float(_FEE_RATE)}


@router.post("/admin/grants")
def admin_grant(payload: AdminGrantRequest, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)) -> dict:
    asset = payload.asset.strip().upper()
    if asset not in _ASSETS:
        raise HTTPException(status_code=422, detail="Unsupported asset")
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    amount = _decimal(payload.amount, precision="0.01" if asset == "TRY" else "0.00000001")
    reference = f"ADMIN-{uuid.uuid4().hex[:12].upper()}"
    _post(db, user.id, asset, amount, "admin_grant", reference, payload.note)
    db.commit()
    return {"reference": reference, "user_id": user.id, "asset": asset, "amount": float(amount), "granted_by": admin.id}


@router.post("/admin/deposits/{deposit_id}/approve")
def approve_deposit(deposit_id: str, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)) -> dict:
    deposit = db.query(BankDeposit).filter(BankDeposit.id == deposit_id).with_for_update().first()
    if deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")
    if deposit.status != "pending":
        raise HTTPException(status_code=409, detail="Deposit has already been processed")
    _post(db, deposit.user_id, "TRY", Decimal(deposit.amount_try), "bank_deposit_credit", f"BANK-{deposit.id}")
    deposit.status = "approved"
    deposit.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
    deposit.approved_by_user_id = admin.id
    db.commit()
    return {"id": deposit.id, "status": deposit.status, "amount_try": float(deposit.amount_try)}


@router.get("/admin/deposits")
def list_pending_deposits(_: User = Depends(require_role("admin")), db: Session = Depends(get_db)) -> dict:
    rows = (
        db.query(BankDeposit, User.email)
        .join(User, User.id == BankDeposit.user_id)
        .filter(BankDeposit.status == "pending")
        .order_by(BankDeposit.created_at.asc())
        .limit(100)
        .all()
    )
    return {
        "items": [
            {"id": deposit.id, "email": email, "amount_try": float(deposit.amount_try), "reference": deposit.transfer_reference, "created_at": deposit.created_at.isoformat()}
            for deposit, email in rows
        ]
    }
