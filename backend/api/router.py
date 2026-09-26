from __future__ import annotations

import logging
from typing import Callable, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)
api_router = APIRouter()


def _safe_include(router_getter: Callable[[], Any], *args: Any, **kwargs: Any) -> None:
    try:
        r = router_getter()
        if r is not None:
            api_router.include_router(r, *args, **kwargs)
    except Exception as exc:
        logger.info("Optional router skipped in serverless environment: %s", exc)


# 1. Core financial & market data routers
_safe_include(lambda: __import__("backend.api.routes.watchlists", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.equity.routes", fromlist=["equity_router"]).equity_router)
_safe_include(lambda: __import__("backend.fno.routes", fromlist=["fno_router"]).fno_router)
_safe_include(lambda: __import__("backend.api.routes.analytics", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.market_context", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.fno.routes.flow", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.heatmap", fromlist=["router"]).router, prefix="/api/heatmap")
_safe_include(lambda: __import__("backend.api.routes.journal", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.notifications", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.insider", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.etf", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.tape", fromlist=["router"]).router, prefix="/api/tape")
_safe_include(lambda: __import__("backend.data_quality.admin_routes", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.data_quality.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.instruments.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.routers.chart_workstation", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.routers.charts", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.saved_views.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.tca.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.fixed_income", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.bonds", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.economics", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.correlation", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.wallet", fromlist=["router"]).router)

# 2. Notes, AI & Brain routers
_safe_include(lambda: __import__("backend.api.routes.ai", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.brain", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.brain_memos", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.external_notes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.notes", fromlist=["router"]).router, prefix="/api")

# 3. Optional heavy analytics & quant feature routers (safely loaded if dependencies are present)
_safe_include(lambda: __import__("backend.api.routes.pair_trading", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.factor_analysis", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.stress_test", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.cockpit.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.portfolio_backtests.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.risk_engine.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.experiments.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.reports.tearsheet_routes", fromlist=["tearsheet_router"]).tearsheet_router, prefix="/api")
_safe_include(lambda: __import__("backend.screener.factor_routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.nlp.routes", fromlist=["router"]).router, prefix="/api")
_safe_include(lambda: __import__("backend.api.routes.framework", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.portfolio_optimizer", fromlist=["router"]).router)
_safe_include(lambda: __import__("backend.api.routes.statlab", fromlist=["router"]).router)

__all__ = ["api_router"]
