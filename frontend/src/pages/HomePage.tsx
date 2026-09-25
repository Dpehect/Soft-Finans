import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  BarChart3,
  LineChart,
  Globe,
  Zap,
  Layers,
  Compass,
  ArrowRight,
  ExternalLink,
  Coins,
  Wallet,
  Newspaper,
  CheckCircle2,
} from "lucide-react";
import { RunningFox } from "../components/common/RunningFox";
import { SoftBridgeLogo } from "../components/common/SoftBridgeLogo";
import { UmayFoxLogo } from "../components/crypto/UmayFoxLogo";

import {
  fetchBacktestV1Presets,
  fetchLatestNews,
  fetchPortfolio,
  fetchPortfolioBenchmarkOverlay,
  fetchQuotesBatch,
  fetchWatchlist,
  type NewsLatestApiItem,
} from "../api/client";
import { ExposureHeatmap } from "../components/dashboard/ExposureHeatmap";
import { GuidedEmptyState } from "../components/dashboard/GuidedEmptyState";
import { IntelligenceTimeline } from "../components/dashboard/IntelligenceTimeline";
import { LiveClockStrip } from "../components/home/LiveClockStrip";
import { MarketHeatStrip, type MarketHeatStripItem } from "../components/home/MarketHeatStrip";
import { MetricCard } from "../components/home/MetricCard";
import { PortfolioMiniChart } from "../components/home/PortfolioMiniChart";
import { ProfileCompletionRing } from "../components/home/ProfileCompletionRing";
import { QuickNavGrid, type QuickNavSection } from "../components/home/QuickNavGrid";
import { SparklineCell } from "../components/home/SparklineCell";
import { SystemHealthBar, type SystemHealthItem } from "../components/home/SystemHealthBar";
import { AiInsightCard } from "../components/terminal/AiInsightCard";
import { TerminalShell } from "../components/layout/TerminalShell";
import { PRIMARY_NAV_ITEMS } from "../components/layout/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useDisplayCurrency } from "../hooks/useDisplayCurrency";
import { fetchChainSummary } from "../fno/api/fnoApi";
import { fetchCollectionBriefing } from "../api/client";
import { useSettingsStore } from "../store/settingsStore";
import type { PortfolioItem } from "../types";
import { asCurrencyCode, type CurrencyCode } from "../lib/currency";
import { getWorkspacePresetConfig, readWorkspacePreset } from "../workspace/presets";

type MarketRow = {
  symbol: string;
  label?: string;
  ltp: number;
  chg: number;
  chgPct: number;
  flash: "up" | "down" | null;
};

type DashboardSnapshot = {
  equityValue: number | null;
  equityCost: number | null;
  equityPnl: number | null;
  accountingStatus: "complete" | "degraded" | "partial" | null;
  holdingsCount: number;
  watchlistCount: number;
  watchlistDerivativesCount: number;
  backtestPresetCount: number;
  fnoSpot: number | null;
  fnoPcr: number | null;
  fnoSignal: string;
  updatedAt: number | null;
};

type NavCard = {
  label: string;
  to: string;
  badge: string;
  configuration?: string;
};

const CONFIGURATION_BY_PATH = new Map(
  PRIMARY_NAV_ITEMS.flatMap((item) => (item.configuration ? [[item.path, item.configuration.detail] as const] : [])),
);

const TRANSITION_FLAG_KEY = "ot-terminal-transition";
const NEWS_LIMIT = 15;

const NAV_CARD_SECTIONS: Array<{ title: string; cards: NavCard[] }> = [
  {
    title: "MARKETS",
    cards: [
      { label: "Equity", to: "/equity/stocks", badge: "M1" },
      {
        label: "F&O",
        to: "/fno",
        badge: "FO",
        configuration: "India live and historical derivatives data require server-side Kite credentials.",
      },
      { label: "Crypto", to: "/equity/crypto", badge: "CR" },
      { label: "Economics", to: "/equity/economics", badge: "EC", configuration: CONFIGURATION_BY_PATH.get("/equity/economics") },
      { label: "Yield Curve", to: "/equity/yield-curve", badge: "YC", configuration: CONFIGURATION_BY_PATH.get("/equity/yield-curve") },
      { label: "Rotation", to: "/equity/sector-rotation", badge: "ROT" },
      { label: "Heatmap", to: "/equity/heatmap", badge: "HM" },
    ],
  },
  {
    title: "DERIVATIVES",
    cards: [
      { label: "Option Chain", to: "/fno", badge: "OC" },
      { label: "Greeks", to: "/fno/greeks", badge: "GR" },
      { label: "Futures", to: "/fno/futures", badge: "FUT" },
      { label: "OI Analysis", to: "/fno/oi", badge: "OI" },
      { label: "Strategy", to: "/fno/strategy", badge: "STR" },
      { label: "PCR", to: "/fno/pcr", badge: "PCR" },
      { label: "Options Flow", to: "/fno/flow", badge: "FLW" },
      { label: "F&O Heatmap", to: "/fno/heatmap", badge: "FHM" },
      { label: "Expiry", to: "/fno/expiry", badge: "EXP" },
    ],
  },
  {
    title: "RESEARCH",
    cards: [
      { label: "Security Hub", to: "/equity/security", badge: "SH" },
      { label: "Screener", to: "/equity/screener", badge: "F2" },
      { label: "Saved Views", to: "/equity/saved-views", badge: "SV" },
      { label: "Factors", to: "/equity/factors", badge: "FAC" },
      { label: "Intelligence", to: "/equity/intelligence-timeline", badge: "INT" },
      { label: "Compare", to: "/equity/compare", badge: "CMP" },
    ],
  },
  {
    title: "LABS",
    cards: [
      { label: "Backtesting", to: "/backtesting", badge: "F9" },
      { label: "Stat Lab", to: "/equity/stat-lab", badge: "SL" },
      { label: "Pair Trading", to: "/equity/pair-trading", badge: "PT" },
    ],
  },
  {
    title: "PORTFOLIO",
    cards: [
      { label: "Holdings", to: "/equity/portfolio", badge: "F3" },
      { label: "Risk Desk", to: "/equity/risk", badge: "RSK" },
      { label: "Correlation", to: "/equity/correlation", badge: "COR" },
      { label: "Paper", to: "/equity/paper", badge: "PP" },
      { label: "Dividends", to: "/equity/dividends", badge: "DIV" },
      { label: "Mutual Funds", to: "/equity/mutual-funds", badge: "MF" },
      { label: "ETF Analytics", to: "/equity/etf-analytics", badge: "ETF" },
    ],
  },
  {
    title: "INTEL",
    cards: [
      { label: "News", to: "/equity/news", badge: "NW" },
      { label: "Alerts", to: "/equity/alerts", badge: "AL" },
      { label: "Watchlist", to: "/equity/watchlist", badge: "F4" },
      { label: "Data Quality", to: "/equity/data-quality", badge: "DQ" },
    ],
  },
  {
    title: "WORKSPACE",
    cards: [
      { label: "Launchpad", to: "/equity/launchpad", badge: "LP" },
      { label: "Workstation", to: "/equity/chart-workstation", badge: "WS" },
      { label: "Settings", to: "/equity/settings", badge: "F6" },
      { label: "Account", to: "/account", badge: "ACC" },
    ],
  },
];

const INITIAL_MARKET_ROWS: MarketRow[] = [
  { symbol: "^GSPC", label: "S&P 500", ltp: 0, chg: 0, chgPct: 0, flash: null },
  { symbol: "^IXIC", label: "NASDAQ", ltp: 0, chg: 0, chgPct: 0, flash: null },
  { symbol: "^DJI", label: "DOW", ltp: 0, chg: 0, chgPct: 0, flash: null },
  { symbol: "GC=F", label: "GOLD", ltp: 0, chg: 0, chgPct: 0, flash: null },
  { symbol: "SI=F", label: "SILVER", ltp: 0, chg: 0, chgPct: 0, flash: null },
  { symbol: "CL=F", label: "CRUDE OIL", ltp: 0, chg: 0, chgPct: 0, flash: null },
];

const MARKET_PULSE_SYMBOLS = INITIAL_MARKET_ROWS.map((row) => row.symbol);

const FALLBACK_PERFORMANCE_POINTS = [
  24300000, 24200000, 24400000, 24500000, 24450000, 24680000, 24720000, 24610000, 24790000, 24840000,
  24770000, 24890000, 24950000, 24810000, 24780000, 24910000, 25030000, 24980000, 25120000, 25190000,
  25150000, 25230000, 25310000, 25280000, 25390000, 25470000, 25420000, 25510000, 25590000, 25670000,
];

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  equityValue: null,
  equityCost: null,
  equityPnl: null,
  accountingStatus: null,
  holdingsCount: 0,
  watchlistCount: 0,
  watchlistDerivativesCount: 0,
  backtestPresetCount: 0,
  fnoSpot: null,
  fnoPcr: null,
  fnoSignal: "NA",
  updatedAt: null,
};

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatCompactDateLabel(date: string): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return date;
  return new Date(parsed).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getMetricTone(value: number | null): "accent" | "up" | "down" | "neutral" {
  if (value == null || !Number.isFinite(value) || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}

function getSignalTone(signal: string): "accent" | "up" | "down" | "neutral" {
  const normalized = signal.trim().toUpperCase();
  if (normalized.includes("BULL")) return "up";
  if (normalized.includes("BEAR")) return "down";
  if (normalized === "NA") return "neutral";
  return "accent";
}

function getSystemTone(signal: string): SystemHealthItem["tone"] {
  const normalized = signal.trim().toUpperCase();
  if (normalized.includes("BULL")) return "ok";
  if (normalized.includes("BEAR")) return "warning";
  if (normalized === "NA") return "neutral";
  return "info";
}

function getSentimentClass(label?: string): string {
  if (label === "Bullish") return "text-terminal-pos";
  if (label === "Bearish") return "text-terminal-neg";
  return "text-terminal-muted";
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatMoney, formatSignedMoney } = useDisplayCurrency();
  const selectedMarket = useSettingsStore((s) => s.selectedMarket);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const realtimeMode = useSettingsStore((s) => s.realtimeMode);
  const newsAutoRefresh = useSettingsStore((s) => s.newsAutoRefresh);
  const newsRefreshSec = useSettingsStore((s) => s.newsRefreshSec);

  const [marketRows, setMarketRows] = useState<MarketRow[]>(INITIAL_MARKET_ROWS);
  const [newsLog, setNewsLog] = useState<NewsLatestApiItem[]>([]);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioCurrency, setPortfolioCurrency] = useState<CurrencyCode | null>(null);
  const [activePreset, setActivePreset] = useState(readWorkspacePreset);
  const [performancePoints, setPerformancePoints] = useState<number[]>(FALLBACK_PERFORMANCE_POINTS);
  const [performanceBenchmarkPoints, setPerformanceBenchmarkPoints] = useState<number[]>([]);
  const [performanceLabels, setPerformanceLabels] = useState<string[]>([]);
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(INITIAL_MARKET_ROWS[0]?.symbol ?? null);
  const [initializing, setInitializing] = useState(() => sessionStorage.getItem(TRANSITION_FLAG_KEY) === "1");
  const [tableTab, setTableTab] = useState<"featured" | "stocks" | "crypto" | "fno">("featured");
  const [quickUmyAmount, setQuickUmyAmount] = useState<string>("100");
  const [quickUmySuccess, setQuickUmySuccess] = useState<boolean>(false);

  const tokensCalculated = Math.floor((parseFloat(quickUmyAmount) || 0) / 0.0040);
  const handleQuickBuyUmy = () => {
    setQuickUmySuccess(true);
    window.setTimeout(() => setQuickUmySuccess(false), 5000);
  };

  const loadSnapshot = useCallback(async () => {
    const [portfolioRes, watchlistRes, backtestRes, chainRes, benchmarkRes] = await Promise.allSettled([
      fetchPortfolio(),
      fetchWatchlist(),
      fetchBacktestV1Presets(),
      fetchChainSummary("SPY"),
      fetchPortfolioBenchmarkOverlay(),
    ]);

    let next = { ...EMPTY_SNAPSHOT };
    let nextBenchmarkPoints: number[] = [];
    let nextPerformanceLabels: string[] = [];

    if (portfolioRes.status === "fulfilled") {
      const data = portfolioRes.value;
      setPortfolioItems(data.items || []);
      const resolvedPortfolioCurrency = asCurrencyCode(
        data.portfolio_currency || data.accounting?.base_currency || data.items[0]?.currency,
      );
      setPortfolioCurrency(resolvedPortfolioCurrency);
      next.equityValue = data.summary.net_liquidation_value;
      next.equityCost = data.summary.total_cost;
      next.equityPnl = data.summary.overall_pnl;
      next.accountingStatus = data.accounting?.status ?? null;
      next.holdingsCount = data.items.length;
    }

    if (watchlistRes.status === "fulfilled") {
      const items = watchlistRes.value;
      next.watchlistCount = items.length;
      next.watchlistDerivativesCount = items.filter((row) => row.has_futures || row.has_options).length;
    }

    if (backtestRes.status === "fulfilled") {
      next.backtestPresetCount = backtestRes.value.length;
    }

    if (chainRes.status === "fulfilled") {
      next.fnoSpot = Number.isFinite(chainRes.value.spot_price) ? chainRes.value.spot_price : null;
      next.fnoPcr = Number.isFinite(chainRes.value.pcr?.pcr_oi) ? chainRes.value.pcr.pcr_oi : null;
      next.fnoSignal = String(chainRes.value.pcr?.signal || "NA").toUpperCase();
    }

    if (benchmarkRes.status === "fulfilled" && benchmarkRes.value?.equity_curve?.length > 0) {
      const curve = benchmarkRes.value.equity_curve;
      const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentCurve = curve.filter((pt) => {
        const ms = Date.parse(`${pt.date}T00:00:00Z`);
        return Number.isFinite(ms) && ms >= cutoffMs;
      });
      const windowCurve = (recentCurve.length >= 2 ? recentCurve : curve.slice(-30)).filter((pt) =>
        Number.isFinite(Number(pt.portfolio)) && Number(pt.portfolio) > 0,
      );

      const currentPortfolioValue =
        next.equityValue != null && Number.isFinite(next.equityValue)
          ? next.equityValue
          : null;
      const lastPortfolio = Number(windowCurve[windowCurve.length - 1]?.portfolio ?? NaN);
      const lastBenchmark = Number(windowCurve[windowCurve.length - 1]?.benchmark ?? NaN);
      const canScalePortfolio = currentPortfolioValue != null && Number.isFinite(lastPortfolio) && lastPortfolio > 0;
      const canScaleBenchmark = currentPortfolioValue != null && Number.isFinite(lastBenchmark) && lastBenchmark > 0;

      const scaledPoints = windowCurve
        .map((pt) => {
          const portfolio = Number(pt.portfolio);
          if (!Number.isFinite(portfolio)) return 0;
          return canScalePortfolio ? (portfolio / lastPortfolio) * currentPortfolioValue! : portfolio;
        })
        .filter((value) => Number.isFinite(value) && value > 0);

      const scaledBenchmarkPoints = windowCurve
        .map((pt) => {
          const benchmark = Number(pt.benchmark);
          if (!Number.isFinite(benchmark)) return 0;
          return canScaleBenchmark ? (benchmark / lastBenchmark) * currentPortfolioValue! : benchmark;
        })
        .filter((value) => Number.isFinite(value) && value > 0);

      if (scaledPoints.length >= 2) {
        setPerformancePoints(scaledPoints);
        nextPerformanceLabels = windowCurve.map((pt) => formatCompactDateLabel(pt.date));
      }

      if (scaledBenchmarkPoints.length >= 2) {
        nextBenchmarkPoints = scaledBenchmarkPoints;
      }
    }

    setPerformanceBenchmarkPoints(nextBenchmarkPoints);
    setPerformanceLabels(nextPerformanceLabels);
    next.updatedAt = Date.now();
    setSnapshot(next);
  }, [selectedMarket]);

  useEffect(() => {
    void loadSnapshot();
    const timer = window.setInterval(() => {
      void loadSnapshot();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [loadSnapshot]);

  useEffect(() => {
    let active = true;

    const loadMarketPulse = async () => {
      try {
        const payload = await fetchQuotesBatch(MARKET_PULSE_SYMBOLS, selectedMarket);
        if (!active) return;
        const quotesBySymbol = new Map(
          (payload?.quotes || []).map((quote) => [String(quote.symbol || "").toUpperCase(), quote]),
        );
        setMarketRows((prev) =>
          prev.map((row) => {
            const quote = quotesBySymbol.get(row.symbol.toUpperCase());
            if (!quote || !Number.isFinite(Number(quote.last))) {
              return row.flash ? { ...row, flash: null } : row;
            }
            const nextLtp = Number(quote.last);
            const nextChg = Number.isFinite(Number(quote.change)) ? Number(quote.change) : row.chg;
            const nextChgPct = Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : row.chgPct;
            const flash: MarketRow["flash"] = nextLtp > row.ltp ? "up" : nextLtp < row.ltp ? "down" : null;
            return {
              ...row,
              ltp: nextLtp,
              chg: nextChg,
              chgPct: nextChgPct,
              flash,
            };
          }),
        );
      } catch {
        if (!active) return;
      }
    };

    void loadMarketPulse();
    const timer = window.setInterval(() => {
      void loadMarketPulse();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedMarket]);

  useEffect(() => {
    let active = true;

    const loadNews = async () => {
      try {
        const items = await fetchLatestNews(NEWS_LIMIT);
        if (active && items.length) {
          setNewsLog(items);
        }
      } catch {
        if (!active) return;
      }
    };

    void loadNews();
    if (newsAutoRefresh) {
      const timer = window.setInterval(() => {
        void loadNews();
      }, newsRefreshSec * 1000);
      return () => {
        active = false;
        window.clearInterval(timer);
      };
    }

    return () => {
      active = false;
    };
  }, [newsAutoRefresh, newsRefreshSec]);

  useEffect(() => {
    if (!initializing) return;
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(TRANSITION_FLAG_KEY);
      setInitializing(false);
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [initializing]);

  useEffect(() => {
    if (marketRows.some((row) => row.symbol === selectedHeatId)) return;
    setSelectedHeatId(marketRows[0]?.symbol ?? null);
  }, [marketRows, selectedHeatId]);

  const equityPnlPct = useMemo(() => {
    if (snapshot.equityPnl == null || snapshot.equityCost == null || snapshot.equityCost <= 0) return null;
    return (snapshot.equityPnl / snapshot.equityCost) * 100;
  }, [snapshot.equityCost, snapshot.equityPnl]);

  const performanceSeries = useMemo(
    () =>
      performancePoints.map((value, index) => ({
        label: performanceLabels[index] ?? `D${index + 1}`,
        value,
      })),
    [performanceLabels, performancePoints],
  );

  const benchmarkSeries = useMemo(
    () =>
      performanceBenchmarkPoints.map((value, index) => ({
        label: performanceLabels[index] ?? `D${index + 1}`,
        value,
      })),
    [performanceBenchmarkPoints, performanceLabels],
  );

  const heatItems = useMemo<MarketHeatStripItem[]>(
    () =>
      marketRows.map((row) => ({
        id: row.symbol,
        label: row.label || row.symbol,
        value: row.ltp > 0 ? row.ltp : null,
        changePct: row.ltp > 0 ? row.chgPct : null,
        changeLabel:
          row.ltp > 0
            ? `${row.chg >= 0 ? "+" : ""}${formatPrice(row.chg)} / ${formatPercent(row.chgPct)}`
            : "--",
        flash: row.flash,
      })),
    [marketRows],
  );

  const focusedMarket = useMemo(
    () => marketRows.find((row) => row.symbol === selectedHeatId) ?? marketRows[0] ?? null,
    [marketRows, selectedHeatId],
  );

  useEffect(() => {
    const onStorage = () => setActivePreset(readWorkspacePreset());
    window.addEventListener("storage", onStorage);
    window.addEventListener("ot:preset-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ot:preset-change", onStorage);
    };
  }, []);

  const presetConfig = getWorkspacePresetConfig(activePreset);
  const showHomeSection = useCallback((section: string) => presetConfig.homeSections.includes(section), [presetConfig.homeSections]);

  const launchSections = useMemo<QuickNavSection[]>(
    () => {
      const preferred = new Set(presetConfig.quickLinks.map((link) => link.to));
      return NAV_CARD_SECTIONS.map((section) => ({
        id: slugify(section.title),
        title: section.title,
        // Show ALL nav cards — the workspace preset only reorders (preferred first),
        // it must never hide features from the launcher.
        items: section.cards
          .slice()
          .sort((a, b) => Number(preferred.has(b.to)) - Number(preferred.has(a.to)))
          .map((card) => ({
          id: `${slugify(section.title)}-${slugify(card.label)}`,
          label: card.label,
          shortcut: card.badge,
          description: card.configuration
            ? `${section.title} desk access. Configuration: ${card.configuration}`
            : `${section.title} desk access`,
          onSelect: () => navigate(card.to),
        })),
      })).filter((section) => section.items.length > 0);
    },
    [navigate, presetConfig.quickLinks],
  );

  const updatedLabel = snapshot.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleTimeString(undefined, { hour12: false })
    : "--:--:--";

  const profileMissingFields = useMemo(() => {
    const missing: string[] = [];
    if (!user?.email) missing.push("Email");
    if (!user?.role) missing.push("Role");
    if (snapshot.updatedAt == null) missing.push("Snapshot");
    if (newsLog.length === 0) missing.push("News");
    return missing;
  }, [newsLog.length, snapshot.updatedAt, user?.email, user?.role]);

  const profileCompletion = Math.round(((4 - profileMissingFields.length) / 4) * 100);

  const systemHealthItems = useMemo<SystemHealthItem[]>(
    () => [
      {
        id: "auth",
        label: "AUTH",
        value: user ? `${user.role.toUpperCase()} READY` : "GUEST",
        tone: user ? "ok" : "warning",
      },
      {
        id: "relay",
        label: "RELAY",
        value: `${selectedMarket} ${realtimeMode.toUpperCase()}`,
        tone: realtimeMode === "ws" ? "ok" : "info",
      },
      {
        id: "snapshot",
        label: "SNAPSHOT",
        value: updatedLabel,
        tone: snapshot.updatedAt ? "stale" : "offline",
      },
      {
        id: "news",
        label: "NEWS",
        value: newsAutoRefresh ? `AUTO ${newsRefreshSec}s` : "MANUAL",
        tone: newsAutoRefresh ? "info" : "neutral",
      },
      {
        id: "fno",
        label: "F&O",
        value: `${snapshot.fnoSignal}${snapshot.fnoPcr != null ? ` | ${snapshot.fnoPcr.toFixed(2)}` : ""}`,
        tone: getSystemTone(snapshot.fnoSignal),
      },
    ],
    [newsAutoRefresh, newsRefreshSec, realtimeMode, selectedMarket, snapshot.fnoPcr, snapshot.fnoSignal, snapshot.updatedAt, updatedLabel, user],
  );

  const leadHeadline = newsLog[0] ?? null;

  return (
    <TerminalShell
      contentClassName="bg-terminal-bg"
      hideTickerLoader
      showMobileBottomNav
      showWorkspaceControls={false}
      statusBarTickerOverride="AKILLI MASASI"
    >
      <div className="relative min-h-full bg-terminal-bg">
        {initializing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-terminal-bg/95 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="flex flex-col items-center rounded-3xl border border-terminal-border/80 bg-terminal-panel/95 p-8 shadow-2xl backdrop-blur-md">
              <RunningFox size="lg" showTrack={true} showParticles={true} />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
                SoftBridge Finans Masası Hazırlanıyor...
              </p>
              <p className="mt-1 text-[11px] text-terminal-muted">
                Portföy, Piyasa ve Kripto Verileri Getiriliyor
              </p>
              <div className="mt-4 h-1.5 w-52 overflow-hidden rounded-full bg-terminal-border/50">
                <div className="h-full w-full bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400 animate-pulse" />
              </div>
            </div>
          </div>
        ) : null}

        {!initializing ? (
          <main className="flex min-h-full flex-col gap-4 p-4 md:p-6 max-w-[1720px] mx-auto w-full" aria-label="SoftBridge Finans Platformu">
            {/* 1. HERO WELCOME & EXECUTIVE BANNER */}
            <section className="relative overflow-hidden rounded-2xl border border-terminal-border bg-gradient-to-br from-terminal-panel via-terminal-panel to-terminal-bg/80 p-5 md:p-6 shadow-sm">
              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 shadow-sm">
                      <SoftBridgeLogo size={14} className="shrink-0" />
                      SOFTBRIDGE FINANS
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Canlı Piyasalar Aktif
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <UmayFoxLogo size={14} /> UMY +24.0%
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-terminal-text">
                    Hoş Geldiniz{user?.email ? `, ${user.email.split('@')[0]}` : ""} 👋
                  </h1>
                  <p className="max-w-2xl text-sm text-terminal-muted leading-relaxed">
                    Küresel piyasalar, portföy getirileri, Umay token ekonomisi ve yapay zeka analiz masası parmaklarınızın ucunda.
                  </p>

                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-terminal-muted">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/60 px-2.5 py-1 font-medium text-terminal-text shadow-xs">
                      <span>👤</span> {user?.email || "Yunus Emre"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/60 px-2.5 py-1 font-medium text-terminal-text shadow-xs">
                      <span>🌍</span> {selectedMarket}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 px-2.5 py-1 font-semibold text-terminal-accent shadow-xs">
                      <span>⚡</span> {presetConfig.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/60 px-2.5 py-1 font-medium text-terminal-text shadow-xs">
                      <span>💱</span> {displayCurrency}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/60 px-2.5 py-1 font-medium text-terminal-muted shadow-xs">
                      <span>🔄</span> Senkron: {updatedLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <LiveClockStrip />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-terminal-border bg-terminal-panel px-3.5 py-2 text-xs font-semibold text-terminal-text shadow-sm transition-all hover:border-terminal-accent hover:bg-terminal-border/20 active:scale-95"
                      onClick={() => navigate("/equity/portfolio")}
                    >
                      <Wallet className="h-3.5 w-3.5 text-terminal-accent" />
                      Portföy Masası
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-terminal-border bg-terminal-panel px-3.5 py-2 text-xs font-semibold text-terminal-text shadow-sm transition-all hover:border-terminal-accent hover:bg-terminal-border/20 active:scale-95"
                      onClick={() => navigate("/equity/chart-workstation")}
                    >
                      <LineChart className="h-3.5 w-3.5 text-terminal-accent" />
                      Grafik İstasyonu
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 px-3.5 py-2 text-xs font-bold text-amber-500 dark:text-amber-400 shadow-sm transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-95"
                      onClick={() => navigate("/equity/umy")}
                    >
                      <UmayFoxLogo size={18} />
                      Umay (UMY) Token
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-terminal-accent px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-terminal-accent/90 hover:scale-[1.02] active:scale-95"
                      onClick={() => navigate("/equity/screener")}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Piyasa Tarayıcısı
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. REAL-TIME MARKET TICKER STRIP */}
            <section aria-label="Canlı Piyasa Fiyatları">
              <MarketHeatStrip
                ariaLabel="Piyasa Şeridi"
                items={heatItems}
                selectedItemId={selectedHeatId}
                formatValue={(value) => (typeof value === "number" ? formatPrice(value) : "--")}
                onSelect={(item) => setSelectedHeatId(item.id)}
              />
            </section>

            {/* 3. 4 KEY FINTECH KPI CARDS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Temel Finansal Göstergeler">
              {/* Card 1: Portföy Değeri (Net Liquidation) */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-terminal-border bg-terminal-panel p-4 shadow-sm transition-all hover:border-terminal-accent/40 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-terminal-muted flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-terminal-accent" />
                      Toplam Portföy Değeri
                    </p>
                    <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-terminal-text">
                      {formatMoney(snapshot.equityValue ?? 0, portfolioCurrency ?? undefined)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    (snapshot.equityPnl ?? 0) >= 0
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}>
                    {(snapshot.equityPnl ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatPercent(equityPnlPct)}
                  </span>
                </div>

                <div className="my-3">
                  <SparklineCell
                    points={performancePoints}
                    ariaLabel="Portföy Getiri Eğrisi"
                    showTooltip
                    className="h-10 w-full"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-terminal-border/60 pt-3 text-xs text-terminal-muted">
                  <span className="font-medium text-terminal-text">
                    {snapshot.holdingsCount} Varlık • {snapshot.watchlistCount} İzleme
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/equity/portfolio")}
                    className="inline-flex items-center gap-1 font-semibold text-terminal-accent hover:underline"
                  >
                    Masayı Aç <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 2: Umay (UMY) Token Spotlight */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-terminal-panel to-cyan-500/10 p-4 shadow-sm transition-all hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <UmayFoxLogo size={34} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                          Umay Token (UMY)
                        </p>
                        <p className="text-[11px] text-terminal-muted">SoftBridge Finans Ekosistemi</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-extrabold text-cyan-500 dark:text-cyan-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                      +24.0% Canlı
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <p className="text-2xl md:text-3xl font-black tracking-tight text-amber-400">
                      0,0040 ₺
                    </p>
                    <span className="text-xs text-terminal-muted font-medium">($0.00012)</span>
                  </div>

                  <p className="mt-1 text-xs text-terminal-muted line-clamp-2">
                    Eski Türk mitolojisinde bereket ve koruyuculuk simgesi Umay Ana'dan esinlenen bağımsız FinTech tokeni.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-amber-500/20 pt-2.5 text-xs">
                  <span className="text-[11px] font-medium text-cyan-400">
                    Açılış: 0,004 ₺ • %24 Ralli
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/equity/umy")}
                    className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    UMY İncele <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 3: Küresel Piyasa Nabzı (Global Market Pulse) */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-terminal-border bg-terminal-panel p-4 shadow-sm transition-all hover:border-terminal-accent/40 hover:shadow-md">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-terminal-muted flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-sky-500" />
                        Küresel Piyasa Nabzı
                      </p>
                      <p className="text-[11px] text-terminal-muted">
                        Odak Varlık: <strong className="text-terminal-text">{focusedMarket?.label || "S&P 500"}</strong>
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      (focusedMarket?.chg ?? 0) >= 0
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}>
                      {(focusedMarket?.chg ?? 0) >= 0 ? "+" : ""}{formatPercent(focusedMarket?.chgPct ?? 0)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <p className="text-2xl md:text-3xl font-bold tracking-tight text-terminal-text">
                      {focusedMarket?.ltp && focusedMarket.ltp > 0 ? formatPrice(focusedMarket.ltp) : "--"}
                    </p>
                    <span className="text-xs text-terminal-muted font-medium">
                      {focusedMarket?.chg && focusedMarket.chg >= 0 ? "+" : ""}{formatPrice(focusedMarket?.chg ?? 0)}
                    </span>
                  </div>

                  {/* Mini quick-selector for indices */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {marketRows.slice(0, 4).map((row) => (
                      <button
                        key={row.symbol}
                        type="button"
                        onClick={() => setSelectedHeatId(row.symbol)}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          selectedHeatId === row.symbol
                            ? "bg-terminal-accent text-white shadow-xs"
                            : "bg-terminal-bg/70 text-terminal-muted hover:text-terminal-text"
                        }`}
                      >
                        {row.label || row.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-terminal-border/60 pt-2.5 text-xs text-terminal-muted">
                  <span>{selectedMarket} İşlem Masası</span>
                  <button
                    type="button"
                    onClick={() => navigate("/equity/stocks")}
                    className="inline-flex items-center gap-1 font-semibold text-terminal-accent hover:underline"
                  >
                    Hisseler <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 4: F&O Vadeli & Opsiyon Duyarlılığı */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-terminal-border bg-terminal-panel p-4 shadow-sm transition-all hover:border-terminal-accent/40 hover:shadow-md">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-terminal-muted flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        F&O Vadeli Duyarlılık
                      </p>
                      <p className="text-[11px] text-terminal-muted">Türev & Opsiyon Analizi</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      snapshot.fnoSignal.includes("BULL")
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : snapshot.fnoSignal.includes("BEAR")
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}>
                      {snapshot.fnoSignal}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[11px] text-terminal-muted block">PCR Oranı</span>
                      <span className="text-base font-bold text-terminal-text mt-0.5 block">
                        {snapshot.fnoPcr != null ? snapshot.fnoPcr.toFixed(2) : "0.80"}
                      </span>
                    </div>
                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[11px] text-terminal-muted block">Vadeli Spot</span>
                      <span className="text-base font-bold text-terminal-text mt-0.5 block">
                        {snapshot.fnoSpot != null ? formatPrice(snapshot.fnoSpot) : "767.62"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-terminal-border/60 pt-2.5 text-xs text-terminal-muted">
                  <span>Opsiyon Zinciri Sinyali</span>
                  <button
                    type="button"
                    onClick={() => navigate("/fno")}
                    className="inline-flex items-center gap-1 font-semibold text-terminal-accent hover:underline"
                  >
                    F&O Masası <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </section>

            {/* 4. YAPAY ZEKA PİYASA ANALİZİ & COPILOT */}
            <section aria-label="Yapay Zeka Görünümü">
              <AiInsightCard
                title="✨ Yapay Zeka Finans Asistanı & Canlı Piyasa Değerlendirmesi"
                description="Yapay zeka modellerimiz küresel makro göstergeleri, hisse hareketlerini ve finansal duyarlılık skorlarını anlık olarak analiz eder."
                disabled={!marketRows.some((row) => row.ltp > 0)}
                disabledMessage="Canlı piyasa verileri henüz yüklenmedi; analiz için veri bekleniyor."
                fetcher={(_, options) =>
                  fetchCollectionBriefing(
                    MARKET_PULSE_SYMBOLS,
                    "global markets",
                    marketRows
                      .filter((row) => row.ltp > 0)
                      .map((row) => ({
                        symbol: row.symbol,
                        label: row.label,
                        price: row.ltp,
                        change: row.chg,
                        change_pct: row.chgPct,
                      })),
                    options,
                  )
                }
              />
            </section>

            {/* 5. MAIN 2-COLUMN WORKSPACE: 8 COLS & 4 COLS */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12" aria-label="Ana Çalışma Masası">
              {/* Left Column (8 cols): Portfolio Chart & Live Holdings / Watchlist */}
              <div className="space-y-4 xl:col-span-8">
                {/* 30 Günlük Portföy Performansı */}
                <div className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-terminal-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-terminal-text flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-terminal-accent" />
                        30 Günlük Portföy Getiri Eğrisi & Benchmark
                      </h2>
                      <p className="mt-0.5 text-xs text-terminal-muted">
                        Portföyünüzün büyüme performansı ve S&P 500 piyasa endeksi ile kıyaslaması.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-terminal-border bg-terminal-bg/70 px-3 py-1 text-xs font-medium text-terminal-muted">
                        Senkronize: {updatedLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/equity/portfolio")}
                        className="inline-flex items-center gap-1 rounded-xl bg-terminal-accent/15 border border-terminal-accent/30 px-3 py-1.5 text-xs font-semibold text-terminal-accent hover:bg-terminal-accent/25 transition-all"
                      >
                        Portföy Masası
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <PortfolioMiniChart
                      points={performanceSeries}
                      benchmarkPoints={benchmarkSeries}
                      ariaLabel="Portföy Performans Grafiği"
                      valueFormatter={(value) => portfolioCurrency
                        ? formatMoney(value, portfolioCurrency)
                        : value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    />
                  </div>
                </div>

                {/* Umay (UMY) Hızlı Alım & Takas Kartı */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-terminal-panel to-cyan-500/10 p-5 shadow-sm transition-all hover:border-amber-400">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <UmayFoxLogo size={40} className="drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-terminal-text">Umay (UMY) Hızlı Alım & Takas</h3>
                            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-500 dark:text-cyan-300">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
                              0,0040 ₺ / +24.0%
                            </span>
                          </div>
                          <p className="text-xs text-terminal-muted max-w-xl">
                            Türk mitolojisinin koruyucu simgesi Umay Ana'dan ilham alan SoftBridge bağımsız FinTech tokeni. %0 platform komisyonu.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets & Input */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex items-center gap-2 rounded-xl border border-terminal-border/80 bg-terminal-bg/70 px-3 py-1.5 shadow-xs">
                        <span className="text-xs font-semibold text-terminal-muted">Tutar:</span>
                        <input
                          type="number"
                          min="1"
                          step="10"
                          value={quickUmyAmount}
                          onChange={(e) => setQuickUmyAmount(e.target.value)}
                          className="w-20 bg-transparent text-sm font-bold text-terminal-text outline-none text-right"
                          placeholder="100"
                        />
                        <span className="text-xs font-bold text-amber-500">₺</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {["100", "250", "500", "1000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setQuickUmyAmount(preset)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                              quickUmyAmount === preset
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "border border-terminal-border bg-terminal-bg/50 text-terminal-muted hover:text-terminal-text hover:border-terminal-accent"
                            }`}
                          >
                            {preset}₺
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-terminal-muted block">Tahmini Alınacak:</span>
                          <span className="text-sm font-black text-cyan-400 block">
                            {tokensCalculated.toLocaleString()} UMY
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleQuickBuyUmy}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          <UmayFoxLogo size={16} />
                          Hemen Al
                        </button>
                      </div>
                    </div>
                  </div>

                  {quickUmySuccess ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 animate-fadeIn">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>
                        Tebrikler! <strong>{tokensCalculated.toLocaleString()} UMY</strong> alım emriniz SoftBridge cüzdanınıza başarıyla işlendi 🦊
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/equity/umy")}
                        className="ml-auto underline font-bold hover:text-emerald-300"
                      >
                        Cüzdanda Gör
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Canlı Varlık & İzleme Masası (Holdings & Asset Radar) */}
                <div className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-terminal-border/70 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-terminal-text flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-terminal-accent" />
                        Canlı Varlık Masası & Piyasa Radarı
                      </h3>
                      <p className="text-xs text-terminal-muted">
                        Öne çıkan varlıklar, hisse senetleri, kripto paralar ve vadeli F&O kontratları.
                      </p>
                    </div>

                    {/* Interactive Tab Switcher */}
                    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-terminal-border/80 bg-terminal-bg/60 p-1">
                      <button
                        type="button"
                        onClick={() => setTableTab("featured")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          tableTab === "featured"
                            ? "bg-terminal-accent text-white shadow-xs"
                            : "text-terminal-muted hover:text-terminal-text"
                        }`}
                      >
                        🔥 Öne Çıkanlar
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableTab("stocks")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          tableTab === "stocks"
                            ? "bg-terminal-accent text-white shadow-xs"
                            : "text-terminal-muted hover:text-terminal-text"
                        }`}
                      >
                        📈 Hisseler
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableTab("crypto")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          tableTab === "crypto"
                            ? "bg-terminal-accent text-white shadow-xs"
                            : "text-terminal-muted hover:text-terminal-text"
                        }`}
                      >
                        🪙 Kripto & Umay
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableTab("fno")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          tableTab === "fno"
                            ? "bg-terminal-accent text-white shadow-xs"
                            : "text-terminal-muted hover:text-terminal-text"
                        }`}
                      >
                        ⚡ F&O Vadeli
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-terminal-border/60 text-terminal-muted font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3">Varlık / Sembol</th>
                          <th className="py-2.5 px-3">Piyasa / Kategori</th>
                          <th className="py-2.5 px-3 text-right">Son Fiyat</th>
                          <th className="py-2.5 px-3 text-right">24s Değişim</th>
                          <th className="py-2.5 px-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-terminal-border/40">
                        {/* 1. TAB: FEATURED (ÖNE ÇIKANLAR) */}
                        {tableTab === "featured" && (
                          <>
                            {/* UMY TOKEN (PINNED FIRST) */}
                            <tr className="hover:bg-amber-500/5 transition-colors group">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <UmayFoxLogo size={32} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
                                  <div>
                                    <div className="font-bold text-terminal-text flex items-center gap-1.5">
                                      <span>UMY</span>
                                      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-500 dark:text-amber-300">
                                        ÖZEL TOKEN
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-terminal-muted">Umay Token • Türk Mitolojisi</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">Kripto / SoftBridge</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">0,0040 ₺</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-bold text-cyan-600 dark:text-cyan-400">
                                  <ArrowUpRight className="h-3 w-3" />
                                  +24.00%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/umy")}
                                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-500 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all"
                                >
                                  Masayı Aç
                                </button>
                              </td>
                            </tr>

                            {/* SFT COIN */}
                            <tr className="hover:bg-terminal-bg/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs">
                                    SFT
                                  </span>
                                  <div>
                                    <div className="font-bold text-terminal-text">SFT</div>
                                    <div className="text-[11px] text-terminal-muted">Soft Coin • SoftBridge Ağı</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">Kripto / Ekosistem</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">1,25 ₺</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  <ArrowUpRight className="h-3 w-3" />
                                  +12.40%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/crypto")}
                                  className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                >
                                  Kripto Masası
                                </button>
                              </td>
                            </tr>

                            {/* NVDA */}
                            <tr className="hover:bg-terminal-bg/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-terminal-text">NVDA</div>
                                <div className="text-[11px] text-terminal-muted">NVIDIA Corporation</div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">NASDAQ / Yarı İletken</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">$128.40</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  +3.22%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/security?ticker=NVDA")}
                                  className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                >
                                  Grafik
                                </button>
                              </td>
                            </tr>

                            {/* AAPL */}
                            <tr className="hover:bg-terminal-bg/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-terminal-text">AAPL</div>
                                <div className="text-[11px] text-terminal-muted">Apple Inc.</div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">NASDAQ / Teknoloji</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">$232.15</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  +1.45%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/security?ticker=AAPL")}
                                  className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                >
                                  Grafik
                                </button>
                              </td>
                            </tr>

                            {/* BTC */}
                            <tr className="hover:bg-terminal-bg/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-bold text-terminal-text">BTC-USD</div>
                                <div className="text-[11px] text-terminal-muted">Bitcoin</div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">Kripto / Katman 1</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">$63,840.00</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  +2.18%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/chart-workstation")}
                                  className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                >
                                  İstasyon
                                </button>
                              </td>
                            </tr>
                          </>
                        )}

                        {/* 2. TAB: STOCKS (HİSSELER) */}
                        {tableTab === "stocks" && (
                          <>
                            {portfolioItems.length > 0
                              ? portfolioItems.map((item) => {
                                  const cost = (item.quantity && item.avg_buy_price) ? item.quantity * item.avg_buy_price : 0;
                                  const pnlPct = (item.pnl != null && cost > 0) ? (item.pnl / cost) * 100 : null;
                                  return (
                                    <tr key={item.ticker} className="hover:bg-terminal-bg/40 transition-colors">
                                      <td className="py-3 px-3">
                                        <div className="font-bold text-terminal-text">{item.ticker}</div>
                                        <div className="text-[11px] text-terminal-muted">{item.exchange || item.ticker}</div>
                                      </td>
                                      <td className="py-3 px-3 text-terminal-muted">{item.sector || selectedMarket}</td>
                                      <td className="py-3 px-3 text-right font-bold text-terminal-text">
                                        {item.current_price != null ? formatMoney(item.current_price) : "--"}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold ${
                                          (item.pnl ?? 0) >= 0
                                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        }`}>
                                          {(item.pnl ?? 0) >= 0 ? "+" : ""}{formatPercent(pnlPct)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/equity/security?ticker=${encodeURIComponent(item.ticker)}`)}
                                          className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                        >
                                          Detay
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              : [
                                  { symbol: "AAPL", name: "Apple Inc.", sector: "Tüketici Elektroniği", price: "$232.15", change: 1.45 },
                                  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Yarı İletken & AI", price: "$128.40", change: 3.22 },
                                  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Bulut & Yazılım", price: "$448.90", change: 0.85 },
                                  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "İnternet Servisleri", price: "$182.30", change: -0.42 },
                                  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "E-Ticaret & AWS", price: "$186.50", change: 1.15 },
                                  { symbol: "TSLA", name: "Tesla Inc.", sector: "Otomotiv & Enerji", price: "$242.80", change: 4.80 },
                                ].map((stock) => (
                                  <tr key={stock.symbol} className="hover:bg-terminal-bg/40 transition-colors">
                                    <td className="py-3 px-3">
                                      <div className="font-bold text-terminal-text">{stock.symbol}</div>
                                      <div className="text-[11px] text-terminal-muted">{stock.name}</div>
                                    </td>
                                    <td className="py-3 px-3 text-terminal-muted">{stock.sector}</td>
                                    <td className="py-3 px-3 text-right font-bold text-terminal-text">{stock.price}</td>
                                    <td className="py-3 px-3 text-right">
                                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold ${
                                        stock.change >= 0
                                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      }`}>
                                        {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/equity/security?ticker=${encodeURIComponent(stock.symbol)}`)}
                                        className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                      >
                                        Analiz
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                          </>
                        )}

                        {/* 3. TAB: CRYPTO (KRİPTO & UMAY) */}
                        {tableTab === "crypto" && (
                          <>
                            {/* UMY */}
                            <tr className="hover:bg-amber-500/5 transition-colors group">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <UmayFoxLogo size={32} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
                                  <div>
                                    <div className="font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                                      <span>UMY</span>
                                      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-500 dark:text-amber-300">
                                        +24% AÇILIŞ
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-terminal-muted">Umay Token • 1 Milyar Arz</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">SoftBridge Finans Ekosistemi</td>
                              <td className="py-3 px-3 text-right font-black text-amber-400">0,0040 ₺</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-bold text-cyan-600 dark:text-cyan-400">
                                  +24.00%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/umy")}
                                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-500 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all"
                                >
                                  UMY Masası
                                </button>
                              </td>
                            </tr>

                            {/* SFT COIN */}
                            <tr className="hover:bg-terminal-bg/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs">
                                    SFT
                                  </span>
                                  <div>
                                    <div className="font-bold text-terminal-text">SFT</div>
                                    <div className="text-[11px] text-terminal-muted">SoftBridge Coin</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-terminal-muted">Platform / Fayda</td>
                              <td className="py-3 px-3 text-right font-bold text-terminal-text">1,25 ₺</td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  +12.40%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate("/equity/crypto")}
                                  className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                >
                                  Detay
                                </button>
                              </td>
                            </tr>

                            {/* BTC, ETH, SOL, AVAX */}
                            {[
                              { symbol: "BTC-USD", name: "Bitcoin", price: "$63,840.00", change: 2.18, sector: "Katman 1 / Rezerv" },
                              { symbol: "ETH-USD", name: "Ethereum", price: "$3,420.50", change: -0.65, sector: "Akıllı Sözleşmeler" },
                              { symbol: "SOL-USD", name: "Solana", price: "$148.20", change: 5.40, sector: "Yüksek Hızlı Katman 1" },
                              { symbol: "AVAX-USD", name: "Avalanche", price: "$28.60", change: 3.10, sector: "Alt Ağlar / DeFi" },
                            ].map((crypto) => (
                              <tr key={crypto.symbol} className="hover:bg-terminal-bg/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-terminal-text">{crypto.symbol}</div>
                                  <div className="text-[11px] text-terminal-muted">{crypto.name}</div>
                                </td>
                                <td className="py-3 px-3 text-terminal-muted">{crypto.sector}</td>
                                <td className="py-3 px-3 text-right font-bold text-terminal-text">{crypto.price}</td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold ${
                                    crypto.change >= 0
                                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  }`}>
                                    {crypto.change >= 0 ? "+" : ""}{crypto.change.toFixed(2)}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => navigate("/equity/chart-workstation")}
                                    className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                  >
                                    Grafik
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* 4. TAB: FNO (F&O VADELİ VE OPSİYON) */}
                        {tableTab === "fno" && (
                          <>
                            {[
                              { symbol: "SPY Dec'26 FUT", name: "S&P 500 E-mini Vadeli", market: "CME Türev", price: "$562.40", change: 0.72 },
                              { symbol: "QQQ 480 CALL", name: "Nasdaq 100 30-Gün Call", market: "CBOE Opsiyon", price: "$14.20", change: 18.50 },
                              { symbol: "NIFTY 50 FUT", name: "Nifty 50 Vadeli Kontrat", market: "NSE Türev", price: "₹25,480.00", change: 0.45 },
                              { symbol: "BANKNIFTY FUT", name: "Bank Nifty Vadeli Kontrat", market: "NSE Türev", price: "₹52,190.00", change: 0.82 },
                            ].map((fno) => (
                              <tr key={fno.symbol} className="hover:bg-terminal-bg/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-terminal-text">{fno.symbol}</div>
                                  <div className="text-[11px] text-terminal-muted">{fno.name}</div>
                                </td>
                                <td className="py-3 px-3 text-terminal-muted">{fno.market}</td>
                                <td className="py-3 px-3 text-right font-bold text-terminal-text">{fno.price}</td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold ${
                                    fno.change >= 0
                                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  }`}>
                                    {fno.change >= 0 ? "+" : ""}{fno.change.toFixed(2)}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => navigate("/fno")}
                                    className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-[11px] font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                                  >
                                    Zinciri Gör
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Heatmap & Timeline when enabled */}
                {showHomeSection("heatmap") && portfolioItems.length > 0 ? (
                  <ExposureHeatmap
                    title="Portföy Sektörel Dağılım Haritası"
                    market={selectedMarket}
                    items={portfolioItems}
                    defaultMode="sector"
                    onCreateWatchlist={() => navigate("/equity/watchlist")}
                    onOpenRisk={() => navigate("/equity/risk")}
                  />
                ) : null}

                {showHomeSection("timeline") ? (
                  <IntelligenceTimeline
                    market={selectedMarket}
                    symbols={portfolioItems.map((item) => item.ticker)}
                    limit={6}
                    title="Piyasa İstihbarat Zaman Çizelgesi"
                    onAddAlert={() => navigate("/equity/alerts")}
                    onOpenScreener={() => navigate("/equity/screener")}
                  />
                ) : null}
              </div>

              {/* Right Column (4 cols): News Feed, System Health, Quick Desks */}
              <div className="space-y-4 xl:col-span-4">
                {/* Canlı Piyasa Bülteni & Haber Akışı */}
                <div className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between border-b border-terminal-border/70 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-terminal-text flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-terminal-accent" />
                        Canlı Piyasa Bülteni
                      </h3>
                      <p className="text-[11px] text-terminal-muted">
                        {newsAutoRefresh ? `Otomatik ${newsRefreshSec}s` : "Anlık"} • Yapay Zeka Duygu Analizi
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/equity/news")}
                      className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-xs font-semibold text-terminal-text hover:border-terminal-accent hover:text-terminal-accent transition-all"
                    >
                      Tüm Haberler
                    </button>
                  </div>

                  {newsLog.length > 0 ? (
                    <ol className="space-y-2.5" role="list" aria-label="Son finans haberleri">
                      {newsLog.slice(0, 5).map((entry) => (
                        <li
                          key={String(entry.id)}
                          className="group rounded-xl border border-terminal-border/70 bg-terminal-bg/40 p-3 hover:border-terminal-accent/50 hover:bg-terminal-border/20 transition-all"
                        >
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block focus-visible:outline-none"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-terminal-muted">
                                  {entry.source}
                                  {entry.published_at
                                    ? ` • ${new Date(entry.published_at).toLocaleTimeString("tr-TR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}`
                                    : ""}
                                </p>
                                <p className="mt-1 text-xs font-medium text-terminal-text group-hover:text-terminal-accent transition-colors line-clamp-2 leading-snug">
                                  {entry.title}
                                </p>
                              </div>
                              {entry.sentiment ? (
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    entry.sentiment.label === "Bullish"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                      : entry.sentiment.label === "Bearish"
                                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                      : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                                  }`}
                                >
                                  {entry.sentiment.label === "Bullish" ? "Pozitif" : entry.sentiment.label === "Bearish" ? "Negatif" : "Nötr"}{" "}
                                  {Math.round(entry.sentiment.confidence * 100)}%
                                </span>
                              ) : null}
                            </div>
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="rounded-xl border border-dashed border-terminal-border p-6 text-center">
                      <Newspaper className="mx-auto h-8 w-8 text-terminal-muted/60" />
                      <p className="mt-2 text-xs font-bold text-terminal-text">Haber Akışı Bekleniyor</p>
                      <p className="mt-1 text-[11px] text-terminal-muted">Canlı bülten ve duygu analizleri için haber masasını açın.</p>
                      <button
                        type="button"
                        onClick={() => navigate("/equity/news")}
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-terminal-accent/15 px-3 py-1.5 text-xs font-semibold text-terminal-accent"
                      >
                        Haber Masasına Git
                      </button>
                    </div>
                  )}
                </div>

                {/* Sistem ve Veri Akışı Durumu */}
                <div className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-terminal-text flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Sistem & Veri Akışı Durumu
                    </h3>
                    <p className="text-[11px] text-terminal-muted">
                      Gerçek zamanlı piyasa relay bağlantısı ve veri sağlığı kontrolü.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[10px] text-terminal-muted uppercase block">Kullanıcı Erişimi</span>
                      <span className="text-xs font-bold text-terminal-text mt-0.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {user ? `${user.role.toUpperCase()} AKTİF` : "MİSAFİR"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[10px] text-terminal-muted uppercase block">Piyasa Akışı</span>
                      <span className="text-xs font-bold text-terminal-text mt-0.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedMarket} • {realtimeMode.toUpperCase()}
                      </span>
                    </div>

                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[10px] text-terminal-muted uppercase block">Son Senkronizasyon</span>
                      <span className="text-xs font-bold text-terminal-text mt-0.5 block">
                        {updatedLabel}
                      </span>
                    </div>

                    <div className="rounded-xl border border-terminal-border/70 bg-terminal-bg/50 p-2.5">
                      <span className="text-[10px] text-terminal-muted uppercase block">Haber Yenileme</span>
                      <span className="text-xs font-bold text-terminal-text mt-0.5 block">
                        {newsAutoRefresh ? `${newsRefreshSec} sn Otomatik` : "Manuel"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hızlı Erişim Çalışma Masaları Grid */}
                <div className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm">
                  <h3 className="text-base font-bold text-terminal-text mb-3 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-terminal-accent" />
                    Hızlı Erişim Masaları
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => navigate("/equity/chart-workstation")}
                      className="flex flex-col items-start rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 hover:border-terminal-accent/60 hover:bg-terminal-border/20 transition-all text-left group"
                    >
                      <LineChart className="h-5 w-5 text-sky-500 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="font-bold text-terminal-text">Grafik İstasyonu</span>
                      <span className="text-[10px] text-terminal-muted">Teknik analiz & indikatörler</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/equity/screener")}
                      className="flex flex-col items-start rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 hover:border-terminal-accent/60 hover:bg-terminal-border/20 transition-all text-left group"
                    >
                      <BarChart3 className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="font-bold text-terminal-text">Hisse Tarayıcısı</span>
                      <span className="text-[10px] text-terminal-muted">Filtreleme & kriterler</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/equity/crypto")}
                      className="flex flex-col items-start rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 hover:border-terminal-accent/60 hover:bg-terminal-border/20 transition-all text-left group"
                    >
                      <Coins className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="font-bold text-terminal-text">Kripto Piyasaları</span>
                      <span className="text-[10px] text-terminal-muted">Bitcoin, Altcoin & UMY</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/fno")}
                      className="flex flex-col items-start rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 hover:border-terminal-accent/60 hover:bg-terminal-border/20 transition-all text-left group"
                    >
                      <Activity className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="font-bold text-terminal-text">F&O Opsiyon</span>
                      <span className="text-[10px] text-terminal-muted">Opsiyon zinciri & vadeli</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/equity/umy")}
                      className="flex flex-col items-start rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent p-3 hover:border-amber-400 hover:shadow-xs transition-all text-left group col-span-2"
                    >
                      <div className="flex items-center justify-between w-full">
                        <UmayFoxLogo size={30} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-500 dark:text-amber-300">
                          +24.0%
                        </span>
                      </div>
                      <span className="font-bold text-amber-500 dark:text-amber-400 mt-1.5">Umay (UMY) Token Masası</span>
                      <span className="text-[11px] text-terminal-muted">Mitolojik hikaye, tokenomics & canlı alım-satım</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. FULL WORKSPACE LAUNCHPAD (QUICK NAV GRID) */}
            {showHomeSection("launch") ? (
              <section className="rounded-2xl border border-terminal-border bg-terminal-panel p-5 shadow-sm" aria-label="Tüm Çalışma Masaları">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-terminal-border/70 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-terminal-text flex items-center gap-2">
                      <Layers className="h-4 w-4 text-terminal-accent" />
                      Platform Çalışma Masaları Matrisi
                    </h2>
                    <p className="text-xs text-terminal-muted">
                      Tüm analiz modülleri, araştırma istasyonları, portföy laboratuvarları ve sistem ayarları.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-3 py-1.5 text-xs font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                      onClick={() => navigate("/equity/chart-workstation")}
                    >
                      Grafik İstasyonu
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-terminal-border bg-terminal-bg/60 px-3 py-1.5 text-xs font-semibold text-terminal-text hover:border-terminal-accent transition-all"
                      onClick={() => navigate("/equity/screener")}
                    >
                      Hisse Tarayıcısı
                    </button>
                  </div>
                </div>
                <QuickNavGrid ariaLabel="Launch matrix" sections={launchSections} columnCount={4} />
              </section>
            ) : null}
          </main>
        ) : null}
      </div>
    </TerminalShell>
  );
}
