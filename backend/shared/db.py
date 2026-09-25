from __future__ import annotations

import sqlite3

from sqlalchemy import event
from sqlalchemy import inspect
from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.db.base import get_sync_database_url
from backend.shared.sql_compat import bool_default, timestamp_type
from backend.shared.sqlite_utils import configure_sqlite_connection

database_url = get_sync_database_url()
connect_args = {"check_same_thread": False, "timeout": 15} if database_url.startswith("sqlite") else {}
engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection: object, connection_record: object) -> None:
    if isinstance(dbapi_connection, sqlite3.Connection):
        configure_sqlite_connection(dbapi_connection)


def init_db() -> None:
    from backend.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_news_sentiment_columns()
    _ensure_backtest_columns()
    _ensure_fundamentals_pit_columns()
    _ensure_alerts_columns()
    _ensure_instrument_master_columns()
    _ensure_portfolio_currency_columns()
    _ensure_default_user()
    _ensure_crypto_tokens()


def _ensure_default_user() -> None:
    try:
        from backend.models.user import User, UserRole

        with SessionLocal() as db:
            user = db.query(User).filter(User.id == "dev-user").first()
            if not user:
                user = User(
                    id="dev-user",
                    email="admin@openterminal.local",
                    hashed_password="",
                    role=UserRole.ADMIN,
                )
                db.add(user)
                db.commit()

            admin_user = db.query(User).filter(User.email == "gurlekyunusemre2@gmail.com").first()
            if not admin_user:
                admin_user = User(
                    id="fTP8Pr249iPeHibi1uUHxVviBPz2",
                    email="gurlekyunusemre2@gmail.com",
                    hashed_password="",
                    role=UserRole.ADMIN,
                )
                db.add(admin_user)
                db.commit()
            elif admin_user.role != UserRole.ADMIN:
                admin_user.role = UserRole.ADMIN
                db.commit()
    except Exception:
        pass



def _ensure_news_sentiment_columns() -> None:
    columns_to_add = {
        "sentiment_score": "REAL",
        "sentiment_label": "TEXT",
        "sentiment_confidence": "REAL",
    }
    inspector = inspect(engine)
    if not inspector.has_table("news_articles"):
        return
    existing = {str(column["name"]) for column in inspector.get_columns("news_articles")}
    with engine.begin() as conn:
        for col, ddl in columns_to_add.items():
            if col in existing:
                continue
            conn.execute(text(f"ALTER TABLE news_articles ADD COLUMN {col} {ddl}"))


def _ensure_backtest_columns() -> None:
    table_columns = {
        "backtest_runs": {
            "data_version_id": "VARCHAR(36)",
            "execution_profile_json": "TEXT DEFAULT '{}'",
        },
        "model_runs": {
            "data_version_id": "VARCHAR(36)",
            "code_hash": "VARCHAR(128)",
            "execution_profile_json": "TEXT DEFAULT '{}'",
        },
    }
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table_name, columns_to_add in table_columns.items():
            if not inspector.has_table(table_name):
                continue
            existing = {str(column["name"]) for column in inspector.get_columns(table_name)}
            for col, ddl in columns_to_add.items():
                if col in existing:
                    continue
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col} {ddl}"))


def _ensure_fundamentals_pit_columns() -> None:
    columns_to_add = {
        "fiscal_period": "VARCHAR(32) NOT NULL DEFAULT ''",
        "release_date_estimated": bool_default(engine, False),
        "source": "VARCHAR(32) NOT NULL DEFAULT ''",
        "market": "VARCHAR(8) NOT NULL DEFAULT ''",
    }
    inspector = inspect(engine)
    if not inspector.has_table("fundamentals_pit"):
        return
    existing = {str(column["name"]) for column in inspector.get_columns("fundamentals_pit")}
    with engine.begin() as conn:
        for col, ddl in columns_to_add.items():
            if col in existing:
                continue
            conn.execute(text(f"ALTER TABLE fundamentals_pit ADD COLUMN {col} {ddl}"))


def _ensure_instrument_master_columns() -> None:
    columns_to_add = {
        "name": "VARCHAR(256)",
        "source": "VARCHAR(16)",
        "search_blob": "VARCHAR(300)",
    }
    inspector = inspect(engine)
    if not inspector.has_table("instrument_master"):
        return
    existing = {str(column["name"]) for column in inspector.get_columns("instrument_master")}
    with engine.begin() as conn:
        for col, ddl in columns_to_add.items():
            if col in existing:
                continue
            conn.execute(text(f"ALTER TABLE instrument_master ADD COLUMN {col} {ddl}"))


def _ensure_alerts_columns() -> None:
    columns_to_add = {
        "conditions": "JSON NOT NULL DEFAULT '[]'",
        "logic": "VARCHAR(5) NOT NULL DEFAULT 'AND'",
        "delivery_channels": "JSON NOT NULL DEFAULT '[\"in_app\"]'",
        "delivery_config": "JSON NOT NULL DEFAULT '{}'",
        "cooldown_minutes": "INTEGER NOT NULL DEFAULT 0",
        "last_triggered_at": timestamp_type(engine),
        "expiry_date": timestamp_type(engine),
        "max_triggers": "INTEGER NOT NULL DEFAULT 0",
        "trigger_count": "INTEGER NOT NULL DEFAULT 0",
        "last_triggered_value": "REAL",
        "last_notification_error": "VARCHAR(512)",
    }
    inspector = inspect(engine)
    if not inspector.has_table("alerts"):
        return
    existing = {str(column["name"]) for column in inspector.get_columns("alerts")}
    with engine.begin() as conn:
        for col, ddl in columns_to_add.items():
            if col in existing:
                continue
            conn.execute(text(f"ALTER TABLE alerts ADD COLUMN {col} {ddl}"))


def _ensure_portfolio_currency_columns() -> None:
    table_columns = {
        "portfolio_holdings": {"cost_basis_currency": "VARCHAR(8)"},
        "portfolio_transactions": {
            "currency": "VARCHAR(8)",
            "fees_currency": "VARCHAR(8)",
        },
    }
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table_name, columns_to_add in table_columns.items():
            if not inspector.has_table(table_name):
                continue
            existing = {str(column["name"]) for column in inspector.get_columns(table_name)}
            for column_name, ddl in columns_to_add.items():
                if column_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}"))


def _ensure_crypto_tokens() -> None:
    try:
        from backend.models.crypto_token import CryptoToken
        from backend.instruments.models import InstrumentMaster

        with SessionLocal() as db:
            # 1. Seed or update UMY token
            umy = db.query(CryptoToken).filter(CryptoToken.symbol == "UMY").first()
            if not umy:
                umy = CryptoToken(
                    id="UMY",
                    symbol="UMY",
                    name="Umay",
                    ticker="UMY-USD",
                    canonical_id="CRYPTO:UMY",
                    network="Solana / EVM",
                    contract_address="UMY11111111111111111111111111111111111111111",
                    total_supply=1_000_000_000.0,
                    circulating_supply=1_000_000_000.0,
                    initial_price_usd=0.0001,
                    current_price_usd=0.000124,
                    initial_price_try=0.004,
                    current_price_try=0.00496,
                    change_pct_24h=24.0,
                    liquidity_pool_pct=80.0,
                    community_rewards_pct=20.0,
                    platform_fee_pct=0.3,
                    slippage_recommended=0.5,
                    story_inspiration="Eski Türk mitolojisinde bereketin, şansın ve koruyuculuğun sembolü olan Umay Ana felsefesi. Köklerden geleceğe uzanan dijital bir koruyucu güç.",
                    developer_background="Tamamen bağımsız bir şekilde, büyük fonların desteği olmaksızın, SoftBridge Solutions bünyesinde bireysel geliştirici disipliniyle minimal bütçeyle hayata geçirilmiştir.",
                    philosophy="Şişirilmiş VC (Girişim Sermayesi) yatırımları veya manipülatif ön satışlar barındırmayan; adil lansman (Fair Launch), saf kod ve topluluk gücüne dayanan bağımsız bir dijital deney ve utility/meme hibrit ekosistemi.",
                    description="Umay, dijital varlıklarınızı koruyan ve büyüten, köklerini tarihten alan bağımsız topluluk tokenidir.",
                    motto="Köklerden Geleceğe",
                )
                db.add(umy)

            # 2. Seed SFT token
            sft = db.query(CryptoToken).filter(CryptoToken.symbol == "SFT").first()
            if not sft:
                sft = CryptoToken(
                    id="SFT",
                    symbol="SFT",
                    name="Soft Coin",
                    ticker="SFT-USD",
                    canonical_id="CRYPTO:SFT",
                    network="SoftBridge Chain / EVM",
                    contract_address="SFTbridge111111111111111111111111111111111",
                    total_supply=100_000_000.0,
                    circulating_supply=100_000_000.0,
                    initial_price_usd=1.046,
                    current_price_usd=1.24,
                    initial_price_try=35.5,
                    current_price_try=42.16,
                    change_pct_24h=18.5,
                    liquidity_pool_pct=70.0,
                    community_rewards_pct=30.0,
                    platform_fee_pct=0.2,
                    slippage_recommended=0.5,
                    story_inspiration="SoftBridge Finans ekosisteminin yerel yönetim ve işlem tokeni.",
                    developer_background="SoftBridge Finans mühendislik ekibi.",
                    philosophy="Yüksek verimlilik, güvenli zincirler arası takas ve platform sadakat ödülleri.",
                    description="SoftBridge ekosisteminin hızlı, düşük komisyonlu yerel yardımcı tokeni.",
                    motto="Finansın Köprüsü",
                )
                db.add(sft)

            # 3. Ensure InstrumentMaster entries for global search & ranking
            umy_inst = db.query(InstrumentMaster).filter(InstrumentMaster.canonical_id == "CRYPTO:UMY").first()
            if not umy_inst:
                umy_inst = InstrumentMaster(
                    canonical_id="CRYPTO:UMY",
                    display_symbol="UMY-USD",
                    name="Umay",
                    search_blob="umy umay umy-usd umay coin crypto token",
                    type="crypto",
                    source="softbridge",
                    exchange="CRYPTO",
                    currency="USD",
                    tick_size="0.000001",
                    lot_size="1",
                    vendor_mappings_json={"softbridge": "UMY-USD", "coingecko": "umay-coin"},
                )
                db.add(umy_inst)

            sft_inst = db.query(InstrumentMaster).filter(InstrumentMaster.canonical_id == "CRYPTO:SFT").first()
            if not sft_inst:
                sft_inst = InstrumentMaster(
                    canonical_id="CRYPTO:SFT",
                    display_symbol="SFT-USD",
                    name="Soft Coin",
                    search_blob="sft sft-usd soft coin crypto token",
                    type="crypto",
                    source="softbridge",
                    exchange="CRYPTO",
                    currency="USD",
                    tick_size="0.001",
                    lot_size="1",
                    vendor_mappings_json={"softbridge": "SFT-USD", "coingecko": "soft-coin"},
                )
                db.add(sft_inst)

            db.commit()
    except Exception:
        pass

