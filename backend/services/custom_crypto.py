"""Custom ecosystem crypto assets: UMY (Umay) and Soft Coin (SFT).

Provides canonical metadata, realistic deterministic OHLCV candles,
tokenomics, allocations, and storytelling narrative for UMY and SFT.
"""

from __future__ import annotations

from datetime import datetime, timezone
import math
from typing import Any

# ============================================================================
# UMY (UMAY) COIN METADATA & TOKENOMICS
# ============================================================================
UMY_METADATA: dict[str, Any] = {
    "symbol": "UMY-USD",
    "name": "Umay",
    "ticker": "UMY",
    "price": 0.000124,  # $0.0001 listing price + 24% = $0.000124 (or 0.00496 TL)
    "price_usd": 0.000124,
    "price_try": 0.00496,
    "open_usd": 0.000100,
    "open_try": 0.00400,
    "change_24h": 24.0,
    "volume_24h": 14_850_000.0,
    "market_cap": 12_480.50,  # Küsüratlı ~12 bin dolar ($12,480.50)
    "market_cap_usd": 12_480.50,
    "market_cap_try": 502_966.15,
    "total_supply": 1_000_000_000.0,
    "circulating_supply": 1_000_000_000.0,
    "sector": "Mitolojik & Utility Hybrid",
    "day_high": 0.000135,
    "day_low": 0.000098,
    "day_high_try": 0.00540,
    "day_low_try": 0.00392,
    "coin_id": "umay-coin",
    "market_cap_rank": 50,
    "network": "Solana / EVM",
    "contract_address_solana": "UMY11111111111111111111111111111111111111111",
    "contract_address_evm": "0x71c89073B25A7fB7F39281a8E649CeA6a0665UMY",
    "allocation": {
        "liquidity_pool_pct": 80.0,
        "liquidity_pool_amount": 800_000_000.0,
        "liquidity_pool_status": "Kilitli / Yakılmış",
        "community_rewards_pct": 20.0,
        "community_rewards_amount": 200_000_000.0,
        "community_rewards_status": "Topluluk Ödülleri & Geliştirme",
    },
    "trading_parameters": {
        "platform_fee_pct": 0.3,
        "slippage_min": 0.1,
        "slippage_max": 0.5,
        "slippage_recommended": 0.5,
    },
    "storytelling": {
        "motto": "Köklerden Geleceğe",
        "description": "Umay, dijital varlıklarınızı koruyan ve büyüten, köklerini tarihten alan bağımsız topluluk tokenidir.",
        "inspiration": (
            "Eski Türk mitolojisinde bereketin, şansın ve koruyuculuğun sembolü olan "
            "'Umay Ana' felsefesi. Köklerden geleceğe uzanan dijital bir koruyucu güç."
        ),
        "developer_background": (
            "Tamamen bağımsız bir şekilde, büyük fonların desteği olmaksızın, "
            "SoftBridge Solutions bünyesinde bireysel geliştirici disipliniyle minimal bütçeyle hayata geçirilmiştir."
        ),
        "philosophy": (
            "Şişirilmiş VC (Girişim Sermayesi) yatırımları veya manipülatif ön satışlar barındırmayan; "
            "adil lansman (Fair Launch), saf kod ve topluluk gücüne dayanan bağımsız bir dijital deney "
            "ve utility/meme hibrit ekosistemi."
        ),
    },
}

# Alias for UMAY-USD pointing to UMY-USD
UMAY_ALIAS = dict(UMY_METADATA)
UMAY_ALIAS["symbol"] = "UMAY-USD"

# ============================================================================
# SFT (SOFT COIN) METADATA
# ============================================================================
SFT_METADATA: dict[str, Any] = {
    "symbol": "SFT-USD",
    "name": "Soft Coin",
    "ticker": "SFT",
    "price": 1.24,
    "price_usd": 1.24,
    "price_try": 42.16,
    "open_usd": 1.046,
    "open_try": 35.56,
    "change_24h": 18.5,
    "volume_24h": 28_450_000.0,
    "market_cap": 124_000_000.0,
    "market_cap_usd": 124_000_000.0,
    "market_cap_try": 4_216_000_000.0,
    "total_supply": 100_000_000.0,
    "circulating_supply": 100_000_000.0,
    "sector": "Ecosystem",
    "day_high": 1.32,
    "day_low": 1.04,
    "day_high_try": 44.88,
    "day_low_try": 35.36,
    "coin_id": "soft-coin",
    "market_cap_rank": 38,
    "network": "SoftBridge Chain / EVM",
    "contract_address_solana": "SFTbridge111111111111111111111111111111111",
    "contract_address_evm": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "allocation": {
        "liquidity_pool_pct": 70.0,
        "liquidity_pool_amount": 70_000_000.0,
        "liquidity_pool_status": "Kilitli",
        "community_rewards_pct": 30.0,
        "community_rewards_amount": 30_000_000.0,
        "community_rewards_status": "Staking & Platform Ödülleri",
    },
    "trading_parameters": {
        "platform_fee_pct": 0.2,
        "slippage_min": 0.1,
        "slippage_max": 0.5,
        "slippage_recommended": 0.3,
    },
    "storytelling": {
        "motto": "Finansın Köprüsü",
        "description": "SoftBridge Finans ekosisteminin hızlı, düşük komisyonlu yerel yardımcı ve yönetim tokeni.",
        "inspiration": "Kesintisiz zincirler arası köprüler ve merkeziyetsiz finansal erişim vizyonu.",
        "developer_background": "SoftBridge Solutions çekirdek mimari ekibi.",
        "philosophy": "Şeffaf, denetlenebilir ve kullanıcı odaklı yeni nesil likidite protokolü.",
    },
}

CUSTOM_COINS_LIST: list[dict[str, Any]] = [UMY_METADATA, SFT_METADATA]
CUSTOM_COINS_MAP: dict[str, dict[str, Any]] = {
    "UMY-USD": UMY_METADATA,
    "UMY": UMY_METADATA,
    "UMAY-USD": UMY_METADATA,
    "UMAY": UMY_METADATA,
    "SFT-USD": SFT_METADATA,
    "SFT": SFT_METADATA,
}


def is_custom_crypto(symbol: str) -> bool:
    norm = (symbol or "").strip().upper()
    if "-" not in norm:
        norm = f"{norm}-USD"
    return norm in CUSTOM_COINS_MAP or norm in ("UMY-USD", "UMAY-USD", "SFT-USD")


def get_custom_coin_metadata(symbol: str) -> dict[str, Any] | None:
    norm = (symbol or "").strip().upper()
    if norm in CUSTOM_COINS_MAP:
        return CUSTOM_COINS_MAP[norm]
    if "-" not in norm:
        norm = f"{norm}-USD"
    return CUSTOM_COINS_MAP.get(norm)


def generate_custom_candles(
    symbol: str,
    interval: str = "1d",
    range_str: str = "1y",
    end_ts: int | None = None,
) -> list[dict[str, float]]:
    """Generate realistic deterministic OHLCV bars.

    For UMY-USD (and UMAY-USD):
      In USD terms:
        Opening price begins at $0.000100.
        Overall performance is +24.0% ending at $0.000124.
      (In TRY terms: 0.00400 TL -> 0.00496 TL, identical +24.0% ratio).

    For SFT-USD:
      Opening price begins at $1.046.
      Overall performance is +18.5% ending at $1.240.
    """
    sym = (symbol or "").strip().upper()
    if "-" not in sym:
        sym = f"{sym}-USD"

    is_umy = "UMY" in sym or "UMAY" in sym
    start_price = 0.000100 if is_umy else 1.046
    target_close = 0.000124 if is_umy else 1.240
    decimals = 6 if is_umy else 3

    interval_norm = interval.lower()
    step_seconds = 86400
    if interval_norm in ("1m",):
        step_seconds = 60
    elif interval_norm in ("2m",):
        step_seconds = 120
    elif interval_norm in ("5m",):
        step_seconds = 300
    elif interval_norm in ("15m",):
        step_seconds = 900
    elif interval_norm in ("30m",):
        step_seconds = 1800
    elif interval_norm in ("1h", "60m"):
        step_seconds = 3600
    elif interval_norm in ("4h",):
        step_seconds = 14400
    elif interval_norm in ("1wk", "1w"):
        step_seconds = 604800
    elif interval_norm in ("1mo", "1m"):
        step_seconds = 2592000

    range_norm = range_str.lower()
    if range_norm in ("1d",):
        num_bars = 48 if step_seconds <= 1800 else 24
    elif range_norm in ("5d",):
        num_bars = 60
    elif range_norm in ("1mo", "1m"):
        num_bars = 30
    elif range_norm in ("3mo",):
        num_bars = 45
    elif range_norm in ("6mo",):
        num_bars = 60
    else:  # "1y", "5y", "max"
        num_bars = 72

    num_bars = max(20, min(200, num_bars))

    if end_ts is None:
        end_ts = int(datetime.now(timezone.utc).timestamp())
    start_ts = end_ts - (num_bars - 1) * step_seconds

    total_gain = target_close - start_price
    candles: list[dict[str, float]] = []
    current_o = start_price

    s0 = 1.0 / (1.0 + math.exp(-6.0 * (0.0 - 0.45)))
    s1 = 1.0 / (1.0 + math.exp(-6.0 * (1.0 - 0.45)))

    for i in range(num_bars):
        t = start_ts + i * step_seconds
        progress = i / max(1, num_bars - 1)

        norm_curve = (1.0 / (1.0 + math.exp(-6.0 * (progress - 0.45))) - s0) / (s1 - s0)
        # Balanced small micro-fluctuations (+ and - variations)
        wave = (math.sin(i * 0.95) * 0.000004 + math.cos(i * 1.6) * 0.000002) if is_umy else (math.sin(i * 0.7) * 0.015)

        if i == 0:
            o = start_price
            c = round(start_price + (0.000001 if is_umy else 0.008), decimals)
        elif i == num_bars - 1:
            o = current_o
            c = target_close
        else:
            o = current_o
            c = round(start_price + total_gain * norm_curve + wave, decimals)
            c = max(start_price * 0.95, min(target_close * 1.05, c))

        spread = abs(c - o)
        buffer = (0.000002 if is_umy else 0.012) + spread * 0.3
        h = round(max(o, c) + buffer, decimals)
        l = round(max(0.000001, min(o, c) - buffer * 0.8), decimals)

        base_vol = 180_000.0 if is_umy else 350_000.0
        vol = round(base_vol * (1.0 + math.cos(i * 0.5) * 0.4 + progress * 0.8), 1)

        candles.append({
            "t": t,
            "o": o,
            "h": h,
            "l": l,
            "c": c,
            "v": vol,
        })
        current_o = c

    candles[0]["o"] = start_price
    candles[-1]["c"] = target_close
    return candles
