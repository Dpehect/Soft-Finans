SoftBridge Financial Analysis & Crypto Trading Platform

Terminal-grade, self-hosted financial terminal that unifies traditional market analytics with custom crypto tokenomics (Soft Coin – SFT and Umay Token – UMY).

Open-source. MIT Licensed. Production-ready.

Full version: https://soft-finans-delta.vercel.app/
Source code: https://github.com/Dpehect/Soft-Finans

Overview

SoftBridge is a full-stack financial workstation inspired by Bloomberg and Refinitiv terminals. It delivers real-time market data, institutional-grade charting, derivatives analytics, portfolio and risk management, quant research, and AI-native private research in a single browser-based interface.

Core coverage:
- US / EU equities
- Crypto as a first-class citizen
- Multi-currency portfolio accounting (USD, EUR, GBP, TRY, INR)
- Soft Coin (SFT) and Umay Token (UMY) tokenomics and micro-fluctuation engines
- Provider-gated India NSE/BSE F&O

Architecture

Browser layer:
- React 18 + TypeScript + Vite 6
- Zustand + TanStack Query
- REST and WebSocket (/api/ws/quotes)

Backend layer:
- Spring Boot microservices for core orchestration, security and async processing
- FastAPI domain services (Python 3.11)
- JWT authentication, CORS and domain routers

Data and infrastructure:
- PostgreSQL 16 with pgvector (Amazon RDS)
- Redis for cache, pub/sub and live ticks (Amazon ElastiCache)
- External providers: Finnhub, Binance, CoinGecko, Yahoo, FMP, Kite
- AWS S3 for media and archives
- AWS CloudWatch for logs, metrics and telemetry
- AWS ECS + EC2 for container orchestration and auto-scaling

Backend Stack

- Core Framework: Spring Boot
- Domain Services: FastAPI (Python 3.11)
- Authentication: Spring Security + JWT
- Persistence: Amazon RDS (PostgreSQL 16) + pgvector
- Caching / Realtime: Amazon ElastiCache (Redis)
- Object Storage: AWS S3
- Observability: AWS CloudWatch
- Container Orchestration: AWS ECS + EC2
- Migrations: Alembic
- Local LLM: Ollama (default) or any OpenAI-compatible endpoint

Key Backend Modules

- Market Data Hub: normalized quote distribution via WebSocket
- Multi-Currency Engine: real-time cross-rate conversion (USD/EUR/GBP/TRY/INR)
- Tokenomics Engine: Brownian-motion based micro-fluctuation and fair-launch logic for SFT and UMY
- Risk Engine: VaR (95%), CVaR, EWMA volatility, PCA factor exposures, stress testing, Monte Carlo
- Backtest Engine: vectorized NumPy, 16+ strategy templates, pair-trading lab, execution-profile modeling
- Second Brain: owner-scoped RAG over journal, portfolio theses and notes (pgvector / numpy cosine)
- Screener & Factor Engine: custom formula evaluation, multi-factor composite scoring (Value / Momentum / Quality / Low-Vol)

Frontend Stack

- Framework: React 18 + TypeScript
- Build Tool: Vite 6
- State Management: Zustand + TanStack Query
- Charting: multi-panel workstation with 70+ indicators
- Realtime: WebSocket subscription layer
- UI: Terminal Noir theme, responsive desktop and mobile layouts

Frontend Capabilities

- Multi-panel chart workstation with synchronized crosshairs, volume profile and replay mode
- GO Bar (Ctrl+G) and Command Palette (Ctrl+K)
- Live ticker tape and quote feed
- One-click multi-currency conversion matrix
- Swap widget and portfolio simulator
- Security Hub with 8-tab analysis
- Advanced screener with query builder and custom formulas
- Risk dashboard and backtesting workspace

Infrastructure (AWS)

- ECS + EC2: containerized microservices with auto-scaling
- Amazon RDS (PostgreSQL): high-availability transactional database
- Amazon ElastiCache (Redis): ultra-low-latency live market data cache
- AWS S3: dynamic data archival and media storage
- AWS CloudWatch: centralized logging, metrics and operational telemetry

Local development uses Docker Compose (PostgreSQL-first) with SQLite fallback for single-process installs.

Quick Start

- Clone the repository
- Copy .env.example to .env
- Run docker compose up -d (recommended)
- Or start backend with uvicorn and frontend with npm run dev

Production image serves both the built SPA and FastAPI on port 8000.

Key Features

Terminal Shell
- Bloomberg-style GO Bar and function keys (F1–F9)
- Fuzzy Command Palette
- Persistent workspace framing (desktop + mobile)

Charting & Technical Analysis
- Up to 9 synchronized panels
- 70+ indicators (SMA, EMA, RSI, MACD, Bollinger, Supertrend, VWAP, ATR and more)
- Drawing tools, volume profile, replay mode, alternative chart types

Portfolio & Risk
- Multi-portfolio CRUD with cost basis and transaction tracking
- Multi-currency ledger, valuation and P&L attribution
- VaR / CVaR, factor analytics, stress testing, correlation clustering

Research & AI
- Local LLM-powered news sentiment and emotion gauge
- Owner-scoped Second Brain (private RAG)
- Multi-factor idea lists and catalyst extraction

Crypto & Tokenomics
- First-class crypto support
- Soft Coin (SFT) and Umay Token (UMY) micro-fluctuation engines
- On-chain style fundamentals (supply dilution, TVL, fee revenue)

Project Structure

- backend/: FastAPI domain services + Spring Boot orchestration layer
- frontend/: React + TypeScript + Vite application
- docs/: Architecture, API reference, surface inventory
- docker-compose.yml and Dockerfile for deployment

Version

v1.7 – Multi-currency portfolio accounting
Next: v2 cross-market intelligence

License

MIT License – free to use, modify and distribute.

Links

Full version: https://soft-finans-delta.vercel.app/
Repository: https://github.com/Dpehect/Soft-Finans
