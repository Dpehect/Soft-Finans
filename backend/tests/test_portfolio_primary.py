"""The per-user primary portfolio replaces the global legacy ``/portfolio``.

GET /api/portfolios/primary returns the same {items, summary} shape the retired
global endpoint did, but scoped to the authenticated user. It auto-creates a
default portfolio on first access, aggregates lots per symbol, and -- the whole
point of retiring the shared table -- never leaks one user's holdings to another.
"""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from backend.api.routes import portfolios as portfolio_routes
from backend.main import app


def _auth_headers(client: TestClient, email: str) -> dict[str, str]:
    password = "pw-primary-12345"
    client.post("/api/auth/register", json={"email": email, "password": password, "role": "trader"})
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_primary_autocreates_default_when_user_has_none() -> None:
    client = TestClient(app)
    headers = _auth_headers(client, "primary-empty@example.com")

    # No portfolio yet -> primary materialises one and returns the legacy shape.
    resp = client.get("/api/portfolios/primary", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["items"] == []
    assert body["summary"]["total_cost"] == 0.0
    assert body["summary"]["total_value"] == 0.0
    assert body["summary"]["overall_pnl"] == 0.0
    assert body["portfolio_currency"] == "USD"
    assert body["accounting"]["status"] == "complete"
    assert body["portfolio_id"]

    # The default now shows up in the user's portfolio list.
    listing = client.get("/api/portfolios", headers=headers).json()["items"]
    assert len(listing) == 1
    assert listing[0]["id"] == body["portfolio_id"]


def _qty_for(body: dict, ticker: str) -> float:
    return sum(float(r["quantity"]) for r in body["items"] if r["ticker"] == ticker)


def test_primary_stays_fixed_and_aggregates_lots(monkeypatch) -> None:
    async def no_live_snapshot(_symbol: str) -> dict:
        return {}

    async def usd_classification(_symbol: str) -> SimpleNamespace:
        return SimpleNamespace(
            model_dump=lambda: {
                "exchange": "NASDAQ",
                "country_code": "US",
                "currency": "USD",
                "flag_emoji": "🇺🇸",
                "has_futures": False,
                "has_options": True,
            },
        )

    monkeypatch.setattr(portfolio_routes, "fetch_stock_snapshot_coalesced", no_live_snapshot)
    monkeypatch.setattr(portfolio_routes.market_classifier, "classify", usd_classification)
    client = TestClient(app)
    headers = _auth_headers(client, f"primary-lots-{uuid4()}@example.com")

    # Whatever the current primary is (auto-created or pre-existing), it must not
    # change when the user creates more portfolios -- dashboards read the primary
    # and need it to stay put.
    primary_id = client.get("/api/portfolios/primary", headers=headers).json()["portfolio_id"]
    client.post("/api/portfolios", headers=headers, json={"name": "Second", "starting_cash": 0})
    assert client.get("/api/portfolios/primary", headers=headers).json()["portfolio_id"] == primary_id

    # Delta-based so the test is robust to a persistent local test DB: record the
    # baseline, add two lots of one symbol to the primary, and assert they were
    # summed into a single aggregated position.
    before = client.get("/api/portfolios/primary", headers=headers).json()
    base_cost = float(before["summary"]["total_cost"])
    base_qty = _qty_for(before, "AAPL")
    for shares, cost in ((10, 100.0), (30, 200.0)):
        client.post(
            f"/api/portfolios/{primary_id}/holdings",
            headers=headers,
            json={"symbol": "AAPL", "shares": shares, "cost_basis_per_share": cost, "currency": "USD"},
        )

    after = client.get("/api/portfolios/primary", headers=headers).json()
    rows = [r for r in after["items"] if r["ticker"] == "AAPL"]
    assert len(rows) == 1  # two lots collapsed into one position
    assert rows[0]["currency"] == "USD"
    assert _qty_for(after, "AAPL") - base_qty == 40
    # total_cost delta = 10*100 + 30*200 = 7000, independent of live quotes.
    assert float(after["summary"]["total_cost"]) - base_cost == 7000.0


def test_primary_converts_rows_and_summary_to_portfolio_base(monkeypatch) -> None:
    async def eur_snapshot(_symbol: str) -> dict:
        return {"current_price": 120.0, "currency": "EUR", "sector": "Technology"}

    async def eur_classification(_symbol: str) -> SimpleNamespace:
        return SimpleNamespace(
            model_dump=lambda: {
                "exchange": "XETRA",
                "country_code": "DE",
                "currency": "EUR",
                "flag_emoji": "🇩🇪",
                "has_futures": False,
                "has_options": False,
            },
        )

    async def rate(source: str, target: str, requested_date):
        assert (source, target) == ("EUR", "USD")
        value = 1.2 if requested_date is not None else 1.3
        return {
            "base_currency": source,
            "quote_currency": target,
            "rate": value,
            "rate_at": datetime(2026, 1, 2, tzinfo=timezone.utc),
            "requested_date": requested_date,
            "source": "test",
            "source_symbol": "EURUSD",
            "freshness": "historical" if requested_date is not None else "live",
            "cache_status": "fresh",
            "degraded": False,
            "degraded_reason": None,
        }

    monkeypatch.setattr(portfolio_routes, "fetch_stock_snapshot_coalesced", eur_snapshot)
    monkeypatch.setattr(portfolio_routes.market_classifier, "classify", eur_classification)
    monkeypatch.setattr(portfolio_routes.forex_service, "get_valuation_rate", rate)
    client = TestClient(app)
    headers = _auth_headers(client, f"primary-base-currency-{uuid4()}@example.com")
    primary_id = client.get("/api/portfolios/primary", headers=headers).json()["portfolio_id"]
    added = client.post(
        f"/api/portfolios/{primary_id}/holdings",
        headers=headers,
        json={
            "symbol": "SAP.DE",
            "shares": 2,
            "cost_basis_per_share": 100,
            "currency": "EUR",
            "purchase_date": "2026-01-02",
        },
    )
    assert added.status_code == 200, added.text

    body = client.get("/api/portfolios/primary", headers=headers).json()
    row = next(item for item in body["items"] if item["ticker"] == "SAP.DE")
    assert body["portfolio_currency"] == "USD"
    assert body["accounting"]["status"] == "complete"
    assert body["summary"]["total_cost"] == 240.0
    assert body["summary"]["total_value"] == 312.0
    assert body["summary"]["overall_pnl"] == 72.0
    assert row["currency"] == "USD"
    assert row["native_currency"] == "EUR"
    assert row["avg_buy_price"] == 120.0
    assert row["current_price"] == 156.0
    assert row["current_value"] == 312.0
    assert row["pnl"] == 72.0


def test_primary_does_not_leak_across_users() -> None:
    client = TestClient(app)
    a = _auth_headers(client, "primary-user-a@example.com")
    b = _auth_headers(client, "primary-user-b@example.com")

    pa = client.post("/api/portfolios", headers=a, json={"name": "A", "starting_cash": 0}).json()["id"]
    client.post(
        f"/api/portfolios/{pa}/holdings",
        headers=a,
        json={"symbol": "TSLA", "shares": 5, "cost_basis_per_share": 100},
    )

    # User B's primary is their own (auto-created), empty -- A's TSLA is invisible.
    body_b = client.get("/api/portfolios/primary", headers=b).json()
    assert body_b["items"] == []
    assert body_b["portfolio_id"] != pa
