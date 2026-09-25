import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { searchSymbols, type SearchSymbolItem } from "../../api/client";
import { Compass, HelpCircle } from "lucide-react";
import { CountryFlag } from "../common/CountryFlag";
import { SoftBridgeLogo } from "../common/SoftBridgeLogo";
import { UmayFoxLogo } from "../crypto/UmayFoxLogo";
import { LanguageSelector } from "../common/LanguageSelector";
import { NotificationBell } from "../notifications/NotificationBell";
import { useGuideStore } from "../guide/guideStore";
import { useTranslation } from "../../lib/i18n";
import { useNavigationHistory } from "../../hooks/useNavigationHistory";
import { inferRecentSecurityAssetClass, inferRecentSecurityMarket, useRecentSecurities } from "../../hooks/useRecentSecurities";
import { useMarketStatus, useTopBarTickers } from "../../hooks/useStocks";
import { useQuotesStore } from "../../realtime/useQuotesStream";
import { useSettingsStore } from "../../store/settingsStore";
import { useStockStore } from "../../store/stockStore";
import { COUNTRY_DEFAULT_MARKET, COUNTRY_MARKETS } from "../../types";
import type { CountryCode, MarketCode } from "../../types";
import type { DisplayCurrency } from "../../store/settingsStore";

const COUNTRY_FLAGS: Record<CountryCode, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
  EU: "🇪🇺",
  CRYPTO: "🪙",
};

type TopBarProps = {
  hideTickerLoader?: boolean;
  hideMarketMarquee?: boolean;
};

const BRAND_ICON_SRC = "/favicon.png";

export function TopBar({ hideTickerLoader = false, hideMarketMarquee = false }: TopBarProps) {
  const navigate = useNavigate();
  const setTicker = useStockStore((s) => s.setTicker);
  const load = useStockStore((s) => s.load);
  const stock = useStockStore((s) => s.stock);
  const ticker = useStockStore((s) => s.ticker);
  const selectedCountry = useSettingsStore((s) => s.selectedCountry);
  const selectedMarket = useSettingsStore((s) => s.selectedMarket);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setSelectedCountry = useSettingsStore((s) => s.selectedCountry === "IN" ? s.setSelectedCountry : s.setSelectedCountry); // keep store reactive
  const setSelectedMarket = useSettingsStore((s) => s.setSelectedMarket);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);
  const themeVariant = useSettingsStore((s) => s.themeVariant);
  const setThemeVariant = useSettingsStore((s) => s.setThemeVariant);
  const { addRecent } = useRecentSecurities();
  const { breadcrumbs } = useNavigationHistory({ autoTrack: true });
  const { startTour, openHelp } = useGuideStore();
  const { t } = useTranslation();

  const { data: polledStatus } = useMarketStatus();
  const realtimeStatus = useQuotesStore((s) => s.marketStatus);
  const { data: topBarTickers } = useTopBarTickers();

  const [query, setQuery] = useState(ticker);
  const [results, setResults] = useState<SearchSymbolItem[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchRequestRef = useRef(0);
  const suppressSuggestionsRef = useRef(false);
  const marketsForCountry = COUNTRY_MARKETS[selectedCountry];

  const statusPayload = (realtimeStatus || polledStatus) as {
    error?: string;
    marketState?: Array<{ marketStatus?: string; tradeDate?: string }>;
    nifty50?: number | null;
    sensex?: number | null;
    inrUsd?: number | null;
    usdInr?: number | null;
    sp500?: number | null;
    nikkei225?: number | null;
    hangseng?: number | null;
    nifty50Pct?: number | null;
    sensexPct?: number | null;
    usdInrPct?: number | null;
    sp500Pct?: number | null;
    nikkei225Pct?: number | null;
    hangsengPct?: number | null;
    fallbackEnabled?: boolean;
    source?: { nseIndices?: boolean };
  } | undefined;
  const marketError = statusPayload?.error;
  const inrUsd = typeof statusPayload?.inrUsd === "number" ? statusPayload.inrUsd : null;
  const usdInr = typeof statusPayload?.usdInr === "number" ? statusPayload.usdInr : null;
  const sp500 = typeof statusPayload?.sp500 === "number" ? statusPayload.sp500 : null;
  const nikkei225 = typeof statusPayload?.nikkei225 === "number" ? statusPayload.nikkei225 : null;
  const hangseng = typeof statusPayload?.hangseng === "number" ? statusPayload.hangseng : null;
  const usdInrPct = typeof statusPayload?.usdInrPct === "number" ? statusPayload.usdInrPct : null;
  const sp500Pct = typeof statusPayload?.sp500Pct === "number" ? statusPayload.sp500Pct : null;
  const nikkei225Pct = typeof statusPayload?.nikkei225Pct === "number" ? statusPayload.nikkei225Pct : null;
  const hangsengPct = typeof statusPayload?.hangsengPct === "number" ? statusPayload.hangsengPct : null;
  const hasIndexData = sp500 !== null;
  const hasGlobalData = sp500 !== null || nikkei225 !== null || hangseng !== null;
  const hasFxData = usdInr !== null || inrUsd !== null;
  const isFallback = Boolean(statusPayload?.fallbackEnabled) || !statusPayload?.source?.nseIndices;
  const marketStateLabel = String(statusPayload?.marketState?.[0]?.marketStatus || "").toUpperCase();
  const feedStateLabel = !hasIndexData
    ? "OFFLINE"
    : marketStateLabel === "CLOSE"
    ? "CLOSED"
    : isFallback
    ? "FALLBACK"
    : "LIVE";
  const backendHealthLabel = hasGlobalData && hasFxData ? "stream ok" : "partial feed";

  const formatFx = (value: number | null) => {
    if (value === null) return "83.15";
    return value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };
  const formatGlobalIndex = (value: number | null) => {
    if (value === null) return "0.00";
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };
  const formatPct = (value: number | null) => {
    const val = value ?? 0;
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };
  const pctClass = (value: number | null) => {
    const val = value ?? 0;
    return val >= 0 ? "text-terminal-pos" : "text-terminal-neg";
  };
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapsedBreadcrumbs = useMemo(() => {
    if (breadcrumbs.length <= 5) return breadcrumbs;
    return [
      breadcrumbs[0],
      breadcrumbs[1],
      { label: "...", path: breadcrumbs[breadcrumbs.length - 2]?.path || breadcrumbs[0].path },
      ...breadcrumbs.slice(-2),
    ];
  }, [breadcrumbs]);

  useEffect(() => {
    setQuery(ticker);
  }, [ticker]);

  useEffect(() => {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) return;

    const resolvedSymbol = String(stock?.ticker || stock?.symbol || "").trim().toUpperCase();
    if (resolvedSymbol && resolvedSymbol !== normalizedTicker) return;

    addRecent(
      normalizedTicker,
      stock?.company_name || normalizedTicker,
      inferRecentSecurityAssetClass(normalizedTicker, stock?.exchange),
      inferRecentSecurityMarket(stock?.country_code || selectedCountry, stock?.exchange || selectedMarket),
      typeof stock?.current_price === "number" ? stock.current_price : undefined,
      typeof stock?.change_pct === "number" ? stock.change_pct : undefined,
    );
  }, [
    addRecent,
    selectedCountry,
    selectedMarket,
    stock?.change_pct,
    stock?.company_name,
    stock?.country_code,
    stock?.current_price,
    stock?.exchange,
    stock?.symbol,
    stock?.ticker,
    ticker,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing =
        tag === "input" || tag === "textarea" || tag === "select" || Boolean(target?.isContentEditable);

      if (event.key === "/" && !editing) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if ((event.key === "m" || event.key === "M") && !editing) {
        event.preventDefault();
        navigate("/equity/portfolio");
        return;
      }
      if (event.key === "Escape") {
        if (results.length > 0) {
          setResults([]);
          setIsSuggestionsOpen(false);
          return;
        }
        if (editing && tag === "input") {
          const inputEl = target as HTMLInputElement;
          inputEl.blur();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, results.length]);

  useEffect(() => {
    if (!marketsForCountry.includes(selectedMarket)) {
      setSelectedMarket(COUNTRY_DEFAULT_MARKET[selectedCountry]);
    }
  }, [marketsForCountry, selectedCountry, selectedMarket, setSelectedMarket]);

  const doSearch = useCallback(async (q: string) => {
    if (suppressSuggestionsRef.current) {
      setResults([]);
      setIsSuggestionsOpen(false);
      return;
    }
    if (q.length < 2) {
      setResults([]);
      setIsSuggestionsOpen(false);
      return;
    }
    const requestId = ++searchRequestRef.current;
    try {
      // Unified instrument search already covers crypto + EU + Yahoo fallback.
      const merged = await searchSymbols(q, selectedMarket);
      const seen = new Set<string>();
      const res = merged.filter((item) => {
        const key = `${(item.ticker || "").toUpperCase()}::${(item.name || "").toUpperCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (requestId !== searchRequestRef.current || suppressSuggestionsRef.current) {
        return;
      }
      setResults(res);
      setIsSuggestionsOpen(res.length > 0);
    } catch {
      if (requestId === searchRequestRef.current) {
        setResults([]);
        setIsSuggestionsOpen(false);
      }
    }
  }, [selectedMarket]);

  const handleLoad = useCallback(async () => {
    setResults([]);
    setIsSuggestionsOpen(false);
    try {
      await load();
    } catch {
      // Stock store handles errors internally
    }
  }, [load]);

  const selectTicker = useCallback((value: string | SearchSymbolItem) => {
    const item = typeof value === "string" ? null : value;
    const symbol = (typeof value === "string" ? value : value.ticker).trim().toUpperCase();
    if (!symbol) return;
    suppressSuggestionsRef.current = true;
    searchRequestRef.current += 1;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setResults([]);
    setIsSuggestionsOpen(false);
    setQuery(symbol);
    setTicker(symbol);
    addRecent(
      symbol,
      item?.name || symbol,
      inferRecentSecurityAssetClass(symbol, item?.exchange),
      inferRecentSecurityMarket(item?.country_code || selectedCountry, item?.exchange || selectedMarket),
    );
    void handleLoad();
  }, [addRecent, handleLoad, selectedCountry, selectedMarket, setTicker]);
  const safeTicker = (ticker || "AAPL").toUpperCase();

  return (
    <header className="relative z-20 h-14 border-b border-terminal-border bg-terminal-panel/95 backdrop-blur-md px-3 md:px-4">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Canlı Akış
          </span>
          <span className="hidden xl:inline-flex items-center gap-1 text-xs font-semibold text-terminal-muted">
            <span className="text-terminal-text">{selectedMarket}</span>
          </span>
        </div>
        {!hideTickerLoader ? (
          <div className="ml-2 flex min-w-[340px] flex-[1.4] items-center gap-1.5 xl:min-w-[440px]">
            <input
              ref={searchInputRef}
              className="w-full rounded-lg border border-terminal-border bg-terminal-panel px-3 py-1 text-xs text-terminal-text placeholder:text-terminal-muted/70 outline-none focus:border-terminal-accent focus:ring-2 focus:ring-terminal-accent/20 transition-all shadow-sm"
              placeholder={`${t("searchHint", "Hisse veya sembol ara...")} (${selectedMarket} • tuş: /)`}
              value={query}
              onChange={(e) => {
                const next = e.target.value.toUpperCase();
                suppressSuggestionsRef.current = false;
                setQuery(next);
                setIsSuggestionsOpen(next.length >= 2);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  void doSearch(next);
                }, 300);
              }}
              onFocus={() => {
                if (results.length > 0 && query.length >= 2) {
                  setIsSuggestionsOpen(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setIsSuggestionsOpen(false), 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  selectTicker(query);
                }
                if (e.key === "Escape") {
                  setResults([]);
                  setIsSuggestionsOpen(false);
                }
              }}
            />
            <button
              className="rounded-lg bg-terminal-accent hover:bg-terminal-accent/90 px-3 py-1 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
              onClick={() => {
                selectTicker(query);
              }}
            >
              {t("searchAction", "Ara")}
            </button>
          </div>
        ) : null}
        <div className="flex shrink-0 items-center gap-1.5 border-l border-terminal-border/70 pl-2">
          <select
            className="w-[92px] rounded-lg border border-terminal-border bg-terminal-panel px-2 py-1 text-xs font-medium text-terminal-text outline-none focus:border-terminal-accent focus:ring-2 focus:ring-terminal-accent/20 transition-all shadow-sm cursor-pointer"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
          >
            <option value="IN">{COUNTRY_FLAGS.IN} IN</option>
            <option value="US">{COUNTRY_FLAGS.US} US</option>
            <option value="EU">{COUNTRY_FLAGS.EU} EU</option>
            <option value="CRYPTO">{COUNTRY_FLAGS.CRYPTO} CRYPTO</option>
          </select>
          <select
            className="w-[90px] rounded-lg border border-terminal-border bg-terminal-panel px-2 py-1 text-xs font-medium text-terminal-text outline-none focus:border-terminal-accent focus:ring-2 focus:ring-terminal-accent/20 transition-all shadow-sm cursor-pointer"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value as MarketCode)}
          >
            {marketsForCountry.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-terminal-border/70 pl-2">
          <select
            className="w-[84px] rounded-lg border border-terminal-border bg-terminal-panel px-2 py-1 text-xs font-medium text-terminal-text outline-none focus:border-terminal-accent focus:ring-2 focus:ring-terminal-accent/20 transition-all shadow-sm cursor-pointer"
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as DisplayCurrency)}
            title="Para Birimi"
            aria-label="Para Birimi"
          >
            <option value="USD">USD ($)</option>
            <option value="TRY">TRY (₺)</option>
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
        {/* UMY TOKEN QUICK ACCESS */}
        <Link
          to="/equity/umy"
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-amber-500/15 px-2 text-xs font-bold text-amber-400 transition-all hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 group"
          title="Umay (UMY) Token Hub: Köklerden Geleceğe Mitolojik Token"
          aria-label="UMY Token"
        >
          <UmayFoxLogo size={16} className="drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform" />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-300 bg-clip-text text-transparent font-black tracking-wider">
            UMY
          </span>
          <span className="hidden lg:inline text-[11px] text-cyan-300/90 font-medium">+24%</span>
        </Link>
        {/* REHBER & YARDIM BUTONLARI */}
        <button
          type="button"
          onClick={() => startTour(0)}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-terminal-accent/50 bg-terminal-accent/15 px-2.5 text-xs font-bold text-terminal-accent transition-all hover:bg-terminal-accent/25 hover:border-terminal-accent shadow-sm active:scale-95"
          title="Sitedeki her bölümü adım adım tanıtan interaktif rehberi başlat"
          aria-label="Rehberi Başlat"
        >
          <Compass className="h-3.5 w-3.5 animate-pulse" />
          <span className="tracking-wide">{t("guide", "REHBER")}</span>
        </button>
        <button
          type="button"
          onClick={() => openHelp("sections")}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-panel px-2.5 text-xs font-medium text-terminal-text transition-all hover:border-terminal-accent/70 hover:text-terminal-accent shadow-sm active:scale-95"
          title="Bölüm tanıtımları ve finans sözlüğü"
          aria-label="Yardım Merkezi"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline tracking-wide">{t("help", "YARDIM")}</span>
        </button>
        {/* DİL SEÇİCİ (TR / EN / DE / ES / PT) */}
        <LanguageSelector align="right" />
        <NotificationBell />
        {/* TEMA MODLARI (RENKLİ / DENGELİ / DARK) */}
        <div className="flex shrink-0 items-center rounded-lg border border-terminal-border bg-terminal-panel p-0.5 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setThemeVariant("renkli")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
              themeVariant === "renkli"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md font-bold scale-[1.02] ring-1 ring-white/20"
                : "text-terminal-muted hover:text-terminal-text hover:bg-terminal-bg/50"
            }`}
            title="Renkli Mod: Canlı, enerjik ve eğlenceli renkler"
            aria-label="Renkli Mod"
          >
            <span>🎨</span>
            <span className="hidden xl:inline">{t("themeColorful", "Renkli")}</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeVariant("dengeli")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
              themeVariant === "dengeli" || themeVariant === "terminal-noir" || themeVariant === "light-desk" || !themeVariant
                ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 shadow-sm font-bold scale-[1.02]"
                : "text-terminal-muted hover:text-terminal-text hover:bg-terminal-bg/50"
            }`}
            title="Dengeli Mod: Göz yormayan dinlendirici mat tonlar (Ne parlak ne karanlık)"
            aria-label="Dengeli Mod"
          >
            <span>⚖️</span>
            <span className="hidden xl:inline">{t("themeBalanced", "Dengeli")}</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeVariant("dark")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
              themeVariant === "dark" || themeVariant === "classic-bloomberg"
                ? "bg-slate-900 text-cyan-400 border border-cyan-500/40 shadow-sm font-bold scale-[1.02]"
                : "text-terminal-muted hover:text-terminal-text hover:bg-terminal-bg/50"
            }`}
            title="Dark Mod: Şık, derin ve modern karanlık tema"
            aria-label="Dark Mod"
          >
            <span>🌙</span>
            <span className="hidden xl:inline">{t("themeDark", "Dark")}</span>
          </button>
        </div>
        <Link
          to="/"
          className="inline-flex h-7 shrink-0 items-center border-l border-terminal-border/70 pl-2"
          aria-label="SoftBridge Finans Home"
          title="SoftBridge Finans"
        >
          <SoftBridgeLogo size={20} className="shrink-0" />
        </Link>
        {!hideTickerLoader && isSuggestionsOpen && results.length > 0 && (
          <div className="absolute left-3 right-3 top-10 z-10 max-h-72 overflow-auto rounded border border-terminal-border bg-terminal-panel">
            {results.map((item) => (
              <button
                key={`${item.ticker}:${item.name}`}
                className="block w-full border-b border-terminal-border px-3 py-2 text-left text-sm hover:bg-terminal-bg"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectTicker(item);
                }}
                onClick={() => {
                  selectTicker(item);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <CountryFlag countryCode={item.country_code} flagEmoji={item.flag_emoji} size="sm" />
                  <span>{item.ticker}</span>
                  <span className="text-terminal-muted">- {item.name}</span>
                  {item.exchange ? <span className="text-terminal-muted">({item.exchange})</span> : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
