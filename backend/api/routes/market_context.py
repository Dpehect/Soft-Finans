"""Evidence-first comparison of a symbol with other market proxies."""

from __future__ import annotations

import asyncio
import logging
import re
from datetime import date, datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.api.deps import get_unified_fetcher
from backend.auth.deps import get_current_user
from backend.models import User
from backend.services.cross_market_context import FETCH_RANGES, _daily_closes, compare_closes

router = APIRouter(prefix="/api/market-context", tags=["market-context"])
_SYMBOL = re.compile(r"^[A-Z0-9^._=-]{1,40}$")
logger = logging.getLogger(__name__)


class MarketComparisonRequest(BaseModel):
    anchor: str = Field(min_length=1, max_length=40, examples=["AAPL"])
    comparisons: list[str] = Field(min_length=1, max_length=6, examples=[["SPY", "BTC-USD"]])
    period: Literal["1M", "3M", "6M"] = "1M"


class MarketComparisonRow(BaseModel):
    symbol: str
    status: Literal["available", "unavailable"]
    reason: Literal["missing_history", "insufficient_overlap", "provider_error"] | None = None
    start_date: date | None = None
    end_date: date | None = None
    anchor_latest_date: date | None = None
    comparison_latest_date: date | None = None
    observations: int | None = None
    freshness: Literal["current", "stale"] | None = None
    anchor_return_pct: float | None = None
    comparison_return_pct: float | None = None
    relative_return_pp: float | None = None


class MarketComparisonResponse(BaseModel):
    anchor: str
    period: Literal["1M", "3M", "6M"]
    retrieved_at: datetime
    data_source: Literal["unified_history"]
    return_basis: Literal["native_quote_currency_unadjusted"]
    method: Literal["same_utc_date_daily_closes"]
    comparisons: list[MarketComparisonRow]


def _symbol(raw: str) -> str:
    value = raw.strip().upper()
    if not _SYMBOL.fullmatch(value):
        raise HTTPException(status_code=422, detail=f"Invalid market symbol: {raw!r}")
    return value


@router.post("/compare", response_model=MarketComparisonResponse)
async def compare_market_context(
    payload: MarketComparisonRequest,
    _: User = Depends(get_current_user),
    fetcher: Any = Depends(get_unified_fetcher),
) -> dict[str, Any]:
    """Return observed, date-aligned native-quote returns; never a causal claim."""
    anchor = _symbol(payload.anchor)
    comparisons = list(dict.fromkeys(_symbol(raw) for raw in payload.comparisons))
    if anchor in comparisons:
        raise HTTPException(status_code=422, detail="Anchor cannot be a comparison symbol")
    if not comparisons:
        raise HTTPException(status_code=422, detail="At least one comparison symbol is required")

    histories: dict[str, dict[date, float]] = {}
    errors: set[str] = set()
    semaphore = asyncio.Semaphore(3)

    async def load(symbol: str) -> None:
        async with semaphore:
            try:
                raw = await fetcher.fetch_history(symbol, range_str=FETCH_RANGES[payload.period], interval="1d")
                histories[symbol] = _daily_closes(raw)
            except Exception as exc:
                # A provider failure must not turn a partial comparison into a 500.
                logger.warning("Market-context history failed for %s: %s", symbol, exc)
                errors.add(symbol)
                histories[symbol] = {}

    await asyncio.gather(*(load(symbol) for symbol in [anchor, *comparisons]))

    rows = []
    for symbol in comparisons:
        result = compare_closes(histories[anchor], histories[symbol], period=payload.period)
        if result["status"] == "unavailable" and (anchor in errors or symbol in errors):
            result["reason"] = "provider_error"
        rows.append({"symbol": symbol, **result})

    return {
        "anchor": anchor,
        "period": payload.period,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "data_source": "unified_history",
        "return_basis": "native_quote_currency_unadjusted",
        "method": "same_utc_date_daily_closes",
        "comparisons": rows,
    }
