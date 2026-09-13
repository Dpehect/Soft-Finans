from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from backend.db.models import BacktestRun, VirtualTrade
from backend.models import PortfolioHoldingORM
from backend.services.legacy_holdings import primary_portfolio
from backend.services.watchlists import watchlist_rows_for_user


def _json_flatten(row: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in row.items():
        if isinstance(v, (dict, list)):
            out[k] = json.dumps(v, ensure_ascii=True)
        else:
            out[k] = v
    return out


def rows_for_data_type(db: Session, data_type: str, user_id: str) -> list[dict[str, Any]]:
    key = data_type.strip().lower()
    if key == "watchlist":
        return watchlist_rows_for_user(db, user_id)
    if key == "positions":
        # Keep each lot's native cost basis and explicit denomination. A sync
        # export cannot perform provider-backed FX valuation safely, and
        # aggregating unlike currencies here would recreate the bug v1.7 removes.
        portfolio = primary_portfolio(db, user_id, create=False)
        if portfolio is None:
            return []
        holdings = (
            db.query(PortfolioHoldingORM)
            .filter(PortfolioHoldingORM.portfolio_id == portfolio.id)
            .order_by(PortfolioHoldingORM.created_at.asc())
            .all()
        )
        return [
            {
                "portfolio_id": portfolio.id,
                "portfolio_name": portfolio.name,
                "portfolio_currency": portfolio.currency,
                "ticker": row.symbol,
                "quantity": row.shares,
                "avg_buy_price": row.cost_basis_per_share,
                "cost_basis_currency": row.cost_basis_currency,
                "buy_date": row.purchase_date,
                "lot_id": row.lot_id,
            }
            for row in holdings
        ]
    if key in {"trades", "backtest_trades"}:
        return [
            {
                "id": x.id,
                "portfolio_id": x.portfolio_id,
                "symbol": x.symbol,
                "side": x.side,
                "quantity": x.quantity,
                "price": x.price,
                "timestamp": x.timestamp.isoformat() if x.timestamp else None,
                "pnl_realized": x.pnl_realized,
            }
            for x in db.query(VirtualTrade).all()
        ]
    if key == "screening_results":
        rows: list[dict[str, Any]] = []
        for run in db.query(BacktestRun).order_by(BacktestRun.updated_at.desc()).limit(30).all():
            try:
                parsed = json.loads(run.result_json or "{}")
            except Exception:
                parsed = {}
            rows.append({"run_id": run.run_id, "status": run.status, "result": parsed})
        return rows
    return []


def generate_csv_bytes(rows: list[dict[str, Any]]) -> bytes:
    out = io.StringIO()
    if not rows:
        out.write("no_data\n")
        return out.getvalue().encode("utf-8")
    fieldnames = sorted({k for row in rows for k in row.keys()})
    writer = csv.DictWriter(out, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(_json_flatten(row))
    return out.getvalue().encode("utf-8")


def generate_xlsx_report(rows: list[dict[str, Any]], title: str = "Report") -> bytes:
    try:
        from openpyxl import Workbook
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("openpyxl is required for xlsx export") from exc

    wb = Workbook()
    ws = wb.active
    ws.title = "data"
    ws.append([title, datetime.now(timezone.utc).isoformat()])
    ws.append([])
    if rows:
        headers = sorted({k for row in rows for k in row.keys()})
        ws.append(headers)
        for row in rows:
            ws.append([_json_flatten(row).get(h) for h in headers])
    else:
        ws.append(["no_data"])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def generate_pdf_report(rows: list[dict[str, Any]], title: str = "Portfolio Report") -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from reportlab.pdfgen import canvas
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("reportlab is required for pdf export") from exc

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 2 * cm
    c.setFont("Helvetica-Bold", 13)
    c.drawString(2 * cm, y, title)
    y -= 0.8 * cm
    c.setFont("Helvetica", 9)
    c.drawString(2 * cm, y, f"Generated: {datetime.now(timezone.utc).isoformat()} UTC")
    y -= 0.8 * cm

    if not rows:
        c.drawString(2 * cm, y, "No data")
    else:
        headers = sorted({k for row in rows for k in row.keys()})
        c.setFont("Helvetica-Bold", 8)
        c.drawString(2 * cm, y, " | ".join(headers)[:140])
        y -= 0.5 * cm
        c.setFont("Helvetica", 7)
        for row in rows[:180]:
            text = " | ".join(str(_json_flatten(row).get(h, "")) for h in headers)
            c.drawString(2 * cm, y, text[:165])
            y -= 0.38 * cm
            if y < 2 * cm:
                c.showPage()
                y = height - 2 * cm
                c.setFont("Helvetica", 7)

    c.save()
    return buf.getvalue()
