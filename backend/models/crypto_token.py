"""SQLAlchemy model for Custom / Fair-Launch Crypto Tokens (e.g. UMY Umay Coin)."""

from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from backend.shared.db import Base


class CryptoToken(Base):
    __tablename__ = "crypto_tokens"

    id = Column(String, primary_key=True)  # e.g. "UMY", "SFT"
    symbol = Column(String, unique=True, index=True, nullable=False)  # "UMY"
    name = Column(String, nullable=False)  # "Umay"
    ticker = Column(String, nullable=False)  # "UMY-USD"
    canonical_id = Column(String, unique=True, index=True, nullable=False)  # "CRYPTO:UMY"
    network = Column(String, nullable=False, default="Solana / EVM")
    contract_address = Column(String, nullable=True)
    total_supply = Column(Float, nullable=False, default=1_000_000_000.0)
    circulating_supply = Column(Float, nullable=False, default=1_000_000_000.0)
    initial_price_usd = Column(Float, nullable=False, default=0.0001)
    current_price_usd = Column(Float, nullable=False, default=0.000124)
    initial_price_try = Column(Float, nullable=False, default=0.004)
    current_price_try = Column(Float, nullable=False, default=0.00496)
    change_pct_24h = Column(Float, nullable=False, default=24.0)
    liquidity_pool_pct = Column(Float, nullable=False, default=80.0)
    community_rewards_pct = Column(Float, nullable=False, default=20.0)
    platform_fee_pct = Column(Float, nullable=False, default=0.3)
    slippage_recommended = Column(Float, nullable=False, default=0.5)
    story_inspiration = Column(Text, nullable=True)
    developer_background = Column(Text, nullable=True)
    philosophy = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    motto = Column(String, nullable=True, default="Köklerden Geleceğe")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "ticker": self.ticker,
            "canonical_id": self.canonical_id,
            "network": self.network,
            "contract_address": self.contract_address,
            "total_supply": self.total_supply,
            "circulating_supply": self.circulating_supply,
            "market_cap_usd": self.current_price_usd * self.circulating_supply,
            "market_cap_try": self.current_price_try * self.circulating_supply,
            "initial_price_usd": self.initial_price_usd,
            "current_price_usd": self.current_price_usd,
            "initial_price_try": self.initial_price_try,
            "current_price_try": self.current_price_try,
            "change_pct_24h": self.change_pct_24h,
            "allocation": {
                "liquidity_pool_pct": self.liquidity_pool_pct,
                "community_rewards_pct": self.community_rewards_pct,
                "liquidity_pool_amount": self.total_supply * (self.liquidity_pool_pct / 100.0),
                "community_rewards_amount": self.total_supply * (self.community_rewards_pct / 100.0),
            },
            "trading_parameters": {
                "platform_fee_pct": self.platform_fee_pct,
                "slippage_recommended": self.slippage_recommended,
            },
            "storytelling": {
                "motto": self.motto,
                "description": self.description,
                "inspiration": self.story_inspiration,
                "developer_background": self.developer_background,
                "philosophy": self.philosophy,
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
