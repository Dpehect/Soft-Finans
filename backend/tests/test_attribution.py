from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

import pandas as pd
import pytest

from backend.services import portfolio_analytics as analytics_module
from backend.services.portfolio_analytics import (
    compute_brinson_attribution,
    compute_factor_attribution,
    decompose_base_currency_return,
    portfolio_analytics_service,
)


def test_brinson_sum_invariant() -> None:
    portfolio_weights = {"Technology": 0.55, "Financials": 0.45}
    benchmark_weights = {"Technology": 0.5, "Financials": 0.5}
    portfolio_returns = {"Technology": 0.14, "Financials": 0.05}
    benchmark_returns = {"Technology": 0.10, "Financials": 0.03}
    sector_map = {"AAPL": "Technology", "JPM": "Financials"}

    result = compute_brinson_attribution(portfolio_weights, benchmark_weights, portfolio_returns, benchmark_returns, sector_map)

    assert result["check_sum"] == pytest.approx(result["active_return"], abs=1e-10)
    assert sum(row["total"] for row in result["sectors"]) == pytest.approx(result["active_return"], abs=1e-10)


def test_base_currency_return_decomposition_reconciles_exactly() -> None:
    result = decompose_base_currency_return(100.0, 110.0, 1.0, 1.2)

    assert result["security"] == pytest.approx(0.10)
    assert result["currency"] == pytest.approx(0.20)
    assert result["interaction"] == pytest.approx(0.02)
    assert result["total"] == pytest.approx(0.32)
    assert result["security"] + result["currency"] + result["interaction"] == pytest.approx(result["total"])


def test_brinson_zero_active_return() -> None:
    portfolio_weights = {"Technology": 0.5, "Financials": 0.5}
    benchmark_weights = {"Technology": 0.5, "Financials": 0.5}
    portfolio_returns = {"Technology": 0.08, "Financials": 0.02}
    benchmark_returns = {"Technology": 0.08, "Financials": 0.02}
    sector_map = {"AAPL": "Technology", "JPM": "Financials"}

    result = compute_brinson_attribution(portfolio_weights, benchmark_weights, portfolio_returns, benchmark_returns, sector_map)

    assert result["active_return"] == pytest.approx(0.0, abs=1e-10)
    assert result["check_sum"] == pytest.approx(0.0, abs=1e-10)
    for row in result["sectors"]:
        assert row["allocation"] == pytest.approx(0.0, abs=1e-10)
        assert row["selection"] == pytest.approx(0.0, abs=1e-10)
        assert row["interaction"] == pytest.approx(0.0, abs=1e-10)


def test_brinson_single_sector() -> None:
    portfolio_weights = {"Technology": 1.0}
    benchmark_weights = {"Technology": 1.0}
    portfolio_returns = {"Technology": 0.12}
    benchmark_returns = {"Technology": 0.05}
    sector_map = {"AAPL": "Technology"}

    result = compute_brinson_attribution(portfolio_weights, benchmark_weights, portfolio_returns, benchmark_returns, sector_map)

    row = result["sectors"][0]
    assert row["allocation"] == pytest.approx(0.0, abs=1e-10)
    assert row["selection"] == pytest.approx(0.07, abs=1e-10)
    assert row["interaction"] == pytest.approx(0.0, abs=1e-10)
    assert result["active_return"] == pytest.approx(0.07, abs=1e-10)


def test_brinson_multi_sector() -> None:
    portfolio_weights = {"Technology": 0.3, "Financials": 0.2, "Energy": 0.2, "Health": 0.2, "Consumer": 0.1}
    benchmark_weights = {"Technology": 0.25, "Financials": 0.25, "Energy": 0.2, "Health": 0.15, "Consumer": 0.15}
    portfolio_returns = {"Technology": 0.14, "Financials": 0.08, "Energy": -0.02, "Health": 0.05, "Consumer": 0.04}
    benchmark_returns = {"Technology": 0.11, "Financials": 0.07, "Energy": 0.01, "Health": 0.03, "Consumer": 0.02}
    sector_map = {"AAPL": "Technology", "JPM": "Financials", "XOM": "Energy", "UNH": "Health", "PG": "Consumer"}

    result = compute_brinson_attribution(portfolio_weights, benchmark_weights, portfolio_returns, benchmark_returns, sector_map)

    benchmark_total = sum(benchmark_weights[s] * benchmark_returns[s] for s in benchmark_weights)
    tech = next(row for row in result["sectors"] if row["sector"] == "Technology")
    expected_allocation = (0.3 - 0.25) * (benchmark_returns["Technology"] - benchmark_total)
    expected_selection = 0.25 * (portfolio_returns["Technology"] - benchmark_returns["Technology"])
    expected_interaction = (0.3 - 0.25) * (portfolio_returns["Technology"] - benchmark_returns["Technology"])
    assert tech["allocation"] == pytest.approx(expected_allocation, abs=1e-10)
    assert tech["selection"] == pytest.approx(expected_selection, abs=1e-10)
    assert tech["interaction"] == pytest.approx(expected_interaction, abs=1e-10)
    assert result["check_sum"] == pytest.approx(result["active_return"], abs=1e-10)


def test_factor_attribution_sum() -> None:
    holdings = [
        {"symbol": "AAA", "weight": 0.6},
        {"symbol": "BBB", "weight": 0.4},
    ]
    factor_exposures = {
        "AAA": {"Market": 1.0, "Size": 0.4, "Value": 0.2, "Momentum": 0.3, "Quality": 0.1, "Volatility": 0.2},
        "BBB": {"Market": 1.0, "Size": -0.1, "Value": 0.1, "Momentum": 0.05, "Quality": 0.15, "Volatility": 0.3},
    }
    factor_returns = {"Market": 0.06, "Size": 0.01, "Value": 0.02, "Momentum": 0.03, "Quality": 0.015, "Volatility": -0.01}

    result = compute_factor_attribution(holdings, factor_exposures, factor_returns, target_return=0.082)

    assert result["check_sum"] == pytest.approx(0.082, abs=1e-10)
    assert result["alpha"] == pytest.approx(0.082 - sum(result["contributions"].values()), abs=1e-10)


def test_factor_zero_exposure() -> None:
    holdings = [
        {"symbol": "AAA", "weight": 1.0},
    ]
    factor_exposures = {"AAA": {"Market": 0.0, "Size": 0.0, "Value": 0.0, "Momentum": 0.0, "Quality": 0.0, "Volatility": 0.0}}
    factor_returns = {"Market": 0.05, "Size": 0.01, "Value": 0.02, "Momentum": 0.03, "Quality": 0.01, "Volatility": -0.01}

    result = compute_factor_attribution(holdings, factor_exposures, factor_returns, target_return=0.04)

    assert all(value == pytest.approx(0.0, abs=1e-10) for value in result["contributions"].values())
    assert result["alpha"] == pytest.approx(0.04, abs=1e-10)


def test_portfolio_attribution_service_shapes(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake_loader(db: Any, portfolio_id: str, period: str, benchmark: str):  # noqa: ANN001
        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": "Demo Portfolio",
            "benchmark": benchmark,
            "period": period,
            "holdings": [
                {"symbol": "AAA", "sector": "Technology", "weight": 0.6, "return": 0.12, "current_value": 60.0, "market_cap": 1_000_000_000.0, "pe_ratio": 20.0, "roe_pct": 14.0, "beta": 1.1},
                {"symbol": "BBB", "sector": "Financials", "weight": 0.4, "return": 0.04, "current_value": 40.0, "market_cap": 500_000_000.0, "pe_ratio": 12.0, "roe_pct": 18.0, "beta": 0.9},
            ],
            "portfolio_return": 0.088,
            "benchmark_return": 0.05,
        }

    monkeypatch.setattr(portfolio_analytics_service, "_load_portfolio_attribution_context", _fake_loader)

    result = asyncio.run(portfolio_analytics_service.portfolio_attribution(object(), "demo", period="1M", benchmark="NIFTY50"))

    assert result["portfolio_id"] == "demo"
    assert result["portfolio_name"] == "Demo Portfolio"
    assert result["total_return"] == pytest.approx(0.088, abs=1e-10)
    assert result["active_return"] == pytest.approx(0.038, abs=1e-10)
    assert result["brinson"]["check_sum"] == pytest.approx(result["active_return"], abs=1e-10)
    assert result["factors"]["check_sum"] == pytest.approx(result["total_return"], abs=1e-10)


def test_benchmark_overlay_values_every_series_in_portfolio_base(monkeypatch: pytest.MonkeyPatch) -> None:
    index = pd.to_datetime(["2026-03-19T00:00:00Z", "2026-03-20T00:00:00Z", "2026-03-21T00:00:00Z"])
    closes = {
        "SAP.DE": pd.Series([90.0, 100.0, 110.0], index=index),
        "MSFT": pd.Series([40.0, 50.0, 55.0], index=index),
        "^GSPC": pd.Series([190.0, 200.0, 202.0], index=index),
    }

    async def close(symbol: str, range_str: str = "5y", interval: str = "1d") -> pd.Series:
        return closes[symbol]

    async def snapshot(symbol: str) -> dict[str, Any]:
        return {"currency": "EUR" if symbol == "SAP.DE" else "USD"}

    async def rates(source: str, target: str, dates: list) -> dict[str, dict[str, Any]]:
        values = {"2026-03-19": 1.0, "2026-03-20": 1.0, "2026-03-21": 1.2} if source == "EUR" else {}
        return {
            requested.isoformat(): {
                "base_currency": source,
                "quote_currency": target,
                "rate": values.get(requested.isoformat(), 1.0),
                "rate_at": datetime.combine(requested, datetime.min.time(), tzinfo=timezone.utc),
                "requested_date": requested,
                "source": "test",
                "source_symbol": f"{source}{target}",
                "freshness": "historical",
                "cache_status": "fresh",
                "degraded": False,
                "degraded_reason": None,
            }
            for requested in dates
        }

    monkeypatch.setattr(portfolio_analytics_service, "_close_series", close)
    monkeypatch.setattr(analytics_module, "fetch_stock_snapshot_coalesced", snapshot)
    monkeypatch.setattr(analytics_module.forex_service, "get_historical_valuation_rates", rates)

    result = asyncio.run(
        portfolio_analytics_service.benchmark_overlay(
            [
                SimpleNamespace(ticker="SAP.DE", quantity=2.0, buy_date="2026-03-19"),
                SimpleNamespace(ticker="MSFT", quantity=1.0, buy_date="2026-03-20"),
            ],
            benchmark="S&P500",
            base_currency="USD",
        )
    )

    assert result["status"] == "complete"
    assert result["base_currency"] == "USD"
    assert result["methodology"] == "current_open_holdings_constant_quantity"
    assert result["equity_curve"][0]["date"] == "2026-03-20"
    assert result["equity_curve"][0]["portfolio_value_base"] == pytest.approx(250.0)
    assert result["equity_curve"][1]["portfolio_value_base"] == pytest.approx(319.0)
    assert result["equity_curve"][1]["portfolio"] == pytest.approx(1.276)
    assert result["equity_curve"][1]["benchmark"] == pytest.approx(1.01)

# The attribution HTTP endpoint moved from the retired legacy route
# (/api/portfolio/{id}/attribution) to the per-user Manager route
# (/api/portfolios/{id}/attribution) in v1.1 (part C); it's covered, ownership-
# scoped, in test_portfolio_manager_analytics.py.
