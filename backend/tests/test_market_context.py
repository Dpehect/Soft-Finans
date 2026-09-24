from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.deps import get_unified_fetcher
from backend.api.routes import market_context
from backend.auth.deps import get_current_user
from backend.services.cross_market_context import _daily_closes, compare_closes


def _chart(closes: dict[date, float]) -> dict[str, Any]:
    days = sorted(closes)
    values = [closes[day] for day in days]
    return {
        "chart": {
            "result": [{
                "timestamp": [int(datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).timestamp()) for day in days],
                "indicators": {"quote": [{
                    "open": values, "high": values, "low": values, "close": values,
                    "volume": [100] * len(values),
                }]},
            }]
        }
    }


def test_pairwise_alignment_excludes_crypto_weekend_and_exposes_dates() -> None:
    start = date(2026, 8, 24)
    weekdays = [start + timedelta(days=i) for i in range(32) if (start + timedelta(days=i)).weekday() < 5]
    anchor = {day: 100.0 + i for i, day in enumerate(weekdays)}
    crypto = {start + timedelta(days=i): 200.0 + i for i in range(32)}
    result = compare_closes(anchor, crypto, period="1M", today=date(2026, 9, 24))
    assert result["status"] == "available"
    assert result["start_date"] == "2026-08-25"
    assert result["end_date"] == "2026-09-24"
    assert result["observations"] == len(weekdays) - 1
    assert result["comparison_latest_date"] == "2026-09-24"
    assert result["freshness"] == "current"
    assert result["anchor_return_pct"] == 21.7822


def test_short_or_disjoint_history_never_claims_full_period_return() -> None:
    early = {date(2026, 9, 1): 100.0, date(2026, 9, 24): 110.0}
    late = {date(2026, 9, 22): 200.0, date(2026, 9, 24): 220.0}
    assert compare_closes(early, late, period="1M")["reason"] == "insufficient_overlap"
    assert compare_closes(early, {}, period="1M")["reason"] == "missing_history"


def test_invalid_closes_are_ignored() -> None:
    closes = _daily_closes(_chart({date(2026, 9, 1): 100.0, date(2026, 9, 2): 0.0}))
    assert closes == {date(2026, 9, 1): 100.0}


def _client(data: dict[str, Any]) -> TestClient:
    class FakeFetcher:
        async def fetch_history(self, ticker: str, range_str: str = "1y", interval: str = "1d") -> Any:
            assert range_str == "3mo"
            assert interval == "1d"
            value = data[ticker]
            if isinstance(value, Exception):
                raise value
            return value

    app = FastAPI()
    app.include_router(market_context.router)
    app.dependency_overrides[get_current_user] = lambda: object()
    app.dependency_overrides[get_unified_fetcher] = lambda: FakeFetcher()
    return TestClient(app)


def test_route_retains_partial_results_and_provider_failure() -> None:
    start = date(2026, 8, 24)
    days = [start + timedelta(days=i) for i in range(32)]
    client = _client({
        "AAPL": _chart({day: 100.0 + i for i, day in enumerate(days)}),
        "SPY": _chart({day: 200.0 + i for i, day in enumerate(days)}),
        "BTC-USD": RuntimeError("rate limited"),
    })
    response = client.post("/api/market-context/compare", json={
        "anchor": " aapl ", "comparisons": ["spy", "btc-usd", "SPY"], "period": "1M",
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload["anchor"] == "AAPL"
    assert payload["return_basis"] == "native_quote_currency_unadjusted"
    assert [row["symbol"] for row in payload["comparisons"]] == ["SPY", "BTC-USD"]
    assert payload["comparisons"][0]["status"] == "available"
    assert payload["comparisons"][1]["reason"] == "provider_error"


def test_route_rejects_anchor_as_comparison_and_bad_symbols() -> None:
    client = _client({})
    assert client.post("/api/market-context/compare", json={"anchor": "AAPL", "comparisons": ["aapl"]}).status_code == 422
    assert client.post("/api/market-context/compare", json={"anchor": "AAPL", "comparisons": ["bad symbol"]}).status_code == 422
