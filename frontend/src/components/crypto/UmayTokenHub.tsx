import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Coins,
  Sparkles,
  Flame,
  ArrowRightLeft,
  Lock,
  ExternalLink,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { useStockHistory } from "../../hooks/useStocks";
import { UmayFoxLogo } from "./UmayFoxLogo";
import { useUmayLiveStore } from "../../store/umayLiveStore";
import { useSettingsStore, type DisplayCurrency } from "../../store/settingsStore";
import { useDisplayCurrency } from "../../hooks/useDisplayCurrency";
import { currencySymbol } from "../../lib/currency";

// Umay Token Sikke Logosu (Göksel Koruyucu Tilki Sikkesi)
export function UmayLogo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return <UmayFoxLogo size={size} className={className} />;
}

export function UmayTokenHub() {
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);
  const { formatMoney, formatCompactMoney } = useDisplayCurrency();

  // Canlı Gerçekçi Tokenomics ve Piyasa Değerleri (Zustand Store)
  const {
    priceUsd: CURRENT_PRICE_USD,
    priceTry: CURRENT_PRICE_TRY,
    initialPriceUsd: INITIAL_PRICE_USD,
    initialPriceTry: INITIAL_PRICE_TRY,
    changePct24h: CHANGE_PCT_24H,
    marketCapUsd: MARKET_CAP_USD,
    marketCapTry: MARKET_CAP_TRY,
    totalSupply: TOTAL_SUPPLY,
    circulatingSupply: CIRCULATING_SUPPLY,
    volume24hUmy: VOLUME_24H_UMY,
    volume24hUsd: VOLUME_24H_USD,
    high24hUsd: HIGH_24H_USD,
    low24hUsd: LOW_24H_USD,
    liquidityUsd: LIQUIDITY_USD,
    holdersCount: HOLDERS_COUNT,
    tickDirection: TICK_DIRECTION,
    recentTrades: RECENT_TRADES,
    candles: CANDLES,
    recordUserSwap,
  } = useUmayLiveStore();

  // Chart zaman dilimi
  const [chartRange, setChartRange] = useState<"1d" | "5d" | "1mo" | "3mo" | "1y">("1d");
  const [chartInterval, setChartInterval] = useState<"15m" | "1h" | "1d" | "1wk">("1h");
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle");

  // Al/Sat Swap Widget durumu
  const [swapAction, setSwapAction] = useState<"buy" | "sell">("buy");
  const [payCurrency, setPayCurrency] = useState<"USDT" | "TRY" | "USD">("USDT");
  const [swapAmount, setSwapAmount] = useState<string>("100");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<{
    txHash: string;
    outputAmount: number;
    outputCurrency: string;
    message: string;
  } | null>(null);

  // Market Cap Hesaplayıcı durumu
  const [calcTokens, setCalcTokens] = useState<string>("1000000");
  const [copiedSolana, setCopiedSolana] = useState(false);
  const [copiedEvm, setCopiedEvm] = useState(false);

  // Fiyat geçmişi verisi
  const { isLoading: isChartLoading } = useStockHistory("UMY-USD", chartRange, chartInterval);

  // Swap hesaplamaları
  const unitPrice = payCurrency === "TRY" ? CURRENT_PRICE_TRY : CURRENT_PRICE_USD;
  const numInput = parseFloat(swapAmount) || 0;
  const platformFeePct = 0.3; // %0.3 komisyon
  const feeAmount = numInput * (platformFeePct / 100);

  const estimatedOutput = useMemo(() => {
    if (numInput <= 0) return 0;
    if (swapAction === "buy") {
      const netPay = Math.max(0, numInput - feeAmount);
      return Math.round(netPay / unitPrice);
    } else {
      const grossVal = numInput * unitPrice;
      return grossVal - grossVal * (platformFeePct / 100);
    }
  }, [numInput, feeAmount, swapAction, unitPrice]);

  // Market cap hesaplama
  const calcTokensNum = parseFloat(calcTokens) || 0;
  const calcValueUsd = calcTokensNum * CURRENT_PRICE_USD;
  const calcValueTry = calcTokensNum * CURRENT_PRICE_TRY;

  // Dinamik Mum / Çizgi Grafik Koordinat Hesaplaması
  const yForPrice = (p: number) => {
    const minP = Math.min(LOW_24H_USD * 0.98, 0.000095);
    const maxP = Math.max(HIGH_24H_USD * 1.02, 0.000140);
    const clamped = Math.max(minP, Math.min(maxP, p));
    return 235 - ((clamped - minP) / (maxP - minP)) * 195;
  };

  const chartPoints = useMemo(() => {
    const pts = CANDLES.map((c) => ({ x: c.x, y: yForPrice(c.close) }));
    pts.push({ x: 780, y: yForPrice(CURRENT_PRICE_USD) });
    return pts;
  }, [CANDLES, CURRENT_PRICE_USD, LOW_24H_USD, HIGH_24H_USD]);

  const linePathD = useMemo(() => {
    if (!chartPoints.length) return "";
    let d = `M 20 ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length; i++) {
      const p = chartPoints[i];
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  }, [chartPoints]);

  const areaPathD = useMemo(() => {
    if (!chartPoints.length) return "";
    let d = `M 20 250 L 20 ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length; i++) {
      const p = chartPoints[i];
      d += ` L ${p.x} ${p.y}`;
    }
    d += ` L 780 250 Z`;
    return d;
  }, [chartPoints]);

  const handleSwapExecute = () => {
    if (numInput <= 0) return;
    setIsSwapping(true);
    setSwapResult(null);

    setTimeout(() => {
      const fakeHash = "0x" + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18);
      const outCurr = swapAction === "buy" ? "UMY" : payCurrency;
      const swapUmyAmt = swapAction === "buy" ? estimatedOutput : numInput;
      const swapUsdAmt = swapAction === "buy" ? numInput : estimatedOutput;
      recordUserSwap(swapAction, swapUmyAmt, swapUsdAmt);

      setSwapResult({
        txHash: fakeHash,
        outputAmount: estimatedOutput,
        outputCurrency: outCurr,
        message:
          swapAction === "buy"
            ? `${estimatedOutput.toLocaleString()} UMY başarıyla SoftBridge cüzdanınıza aktarıldı!`
            : `${estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${outCurr} hesabınıza aktarıldı!`,
      });
      setIsSwapping(false);
    }, 600);
  };

  const copyToClipboard = (text: string, type: "solana" | "evm") => {
    navigator.clipboard.writeText(text);
    if (type === "solana") {
      setCopiedSolana(true);
      setTimeout(() => setCopiedSolana(false), 2000);
    } else {
      setCopiedEvm(true);
      setTimeout(() => setCopiedEvm(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200">
      {/* 1. ÜST HERO & CANLI BİLGİ BANDI (Awwwards seviyesi dengeli/renkli/dark uyumlu) */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-terminal-panel to-cyan-500/10 dark:from-[#070b14] dark:via-[#0b132b] dark:to-[#0f172a] p-6 lg:p-8 shadow-sm backdrop-blur-md transition-colors duration-200">
        {/* Arka plan ışık efektleri */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo & Başlık & Motto */}
          <div className="flex items-start gap-4">
            <div className="relative group cursor-pointer shrink-0">
              <UmayLogo size={68} className="transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-slate-950 ring-2 ring-terminal-panel">
                ✓
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-terminal-text lg:text-3xl">
                  Umay <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">(UMY)</span>
                </h1>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                  Fair Launch
                </span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                  Solana / EVM
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400 italic">
                &ldquo;Köklerden Geleceğe&rdquo;
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-terminal-muted">
                Umay, dijital varlıklarınızı koruyan ve büyüten, köklerini tarihten alan bağımsız topluluk tokenidir.
              </p>
            </div>
          </div>

          {/* Fiyat & 24h Değişim Özeti + Para Birimi Seçimi */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-terminal-border/80 bg-terminal-panel/90 p-4 shadow-sm backdrop-blur-md">
            {/* Para Birimi Seçici */}
            <div className="flex flex-col gap-1 border-r border-terminal-border/60 pr-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                🌐 Para Birimi:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {(["USD", "TRY", "EUR", "GBP", "INR"] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setDisplayCurrency(curr as DisplayCurrency)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-black transition-all shadow-xs ${
                      displayCurrency === curr
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 ring-2 ring-amber-400/50 scale-105"
                        : "border border-terminal-border bg-terminal-bg text-terminal-muted hover:text-terminal-text hover:border-amber-500/40"
                    }`}
                  >
                    {curr} ({currencySymbol(curr)})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-terminal-muted">
                <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  TICK_DIRECTION === "up" ? "bg-emerald-400 animate-ping" : TICK_DIRECTION === "down" ? "bg-rose-400 animate-ping" : "bg-cyan-400"
                }`} />
                Canlı Fiyat
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-extrabold tabular-nums transition-colors duration-300 ${
                  TICK_DIRECTION === "up" ? "text-emerald-500" : TICK_DIRECTION === "down" ? "text-rose-500" : "text-terminal-text"
                }`}>
                  {formatMoney(CURRENT_PRICE_USD, "USD", { minimumFractionDigits: 4, maximumFractionDigits: 7 })}
                </span>
                {displayCurrency !== "TRY" && (
                  <span className="text-sm font-semibold text-amber-500 dark:text-amber-400 tabular-nums">
                    ({CURRENT_PRICE_TRY.toFixed(5)} ₺)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-terminal-muted mt-0.5">
                Başlangıç: <span className="text-terminal-text font-medium">{formatMoney(INITIAL_PRICE_USD, "USD", { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-terminal-border/70 hidden sm:block" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-terminal-muted">24 Saatlik Değişim</div>
              <div className={`mt-0.5 inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-base font-extrabold shadow-xs transition-colors duration-300 ${
                CHANGE_PCT_24H >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}>
                <TrendingUp className="h-4 w-4" />
                {CHANGE_PCT_24H >= 0 ? `+${CHANGE_PCT_24H.toFixed(2)}%` : `${CHANGE_PCT_24H.toFixed(2)}%`}
              </div>
              <div className={`text-[11px] font-medium mt-0.5 transition-colors duration-300 ${
                TICK_DIRECTION === "up" ? "text-emerald-600 dark:text-emerald-400" : TICK_DIRECTION === "down" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {TICK_DIRECTION === "up" ? "🟢 +Alış (Mikro Yükseliş)" : TICK_DIRECTION === "down" ? "🔴 -Satış (Mikro Düzeltme)" : "Organik Dalgalanma"}
              </div>
            </div>

            <div className="h-10 w-px bg-terminal-border/70 hidden sm:block" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-terminal-muted">Piyasa Değeri (MCAP)</div>
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-300 tabular-nums mt-0.5">
                {formatMoney(MARKET_CAP_USD, "USD", { compact: false })}
              </div>
              <div className="text-[11px] text-terminal-muted">
                {formatCompactMoney(MARKET_CAP_USD, "USD")}
              </div>
            </div>
          </div>
        </div>

        {/* Akıllı Kontrat Adresleri Hızlı Kopyalama */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-terminal-border/60 pt-4 text-xs">
          <span className="font-semibold text-terminal-muted">Ağ &amp; Kontrat:</span>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-terminal-border bg-terminal-bg/70 px-2.5 py-1 text-terminal-text shadow-xs">
            <span className="font-bold text-amber-500 dark:text-amber-400">Solana:</span>
            <span className="font-mono text-[11px] text-terminal-muted">UMY11...1111</span>
            <button
              type="button"
              onClick={() => copyToClipboard("UMY11111111111111111111111111111111111111111", "solana")}
              className="ml-1 text-terminal-muted hover:text-terminal-text transition-colors"
              title="Solana Kontratını Kopyala"
            >
              {copiedSolana ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-terminal-border bg-terminal-bg/70 px-2.5 py-1 text-terminal-text shadow-xs">
            <span className="font-bold text-cyan-600 dark:text-cyan-400">EVM:</span>
            <span className="font-mono text-[11px] text-terminal-muted">0x71c...5UMY</span>
            <button
              type="button"
              onClick={() => copyToClipboard("0x71c89073B25A7fB7F39281a8E649CeA6a0665UMY", "evm")}
              className="ml-1 text-terminal-muted hover:text-terminal-text transition-colors"
              title="EVM Kontratını Kopyala"
            >
              {copiedEvm ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <Link
            to="/equity/stocks?symbol=UMY-USD"
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-500 dark:text-amber-400 hover:underline"
          >
            İleri Düzey İşlem Masasında Aç <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 2. ORTA BÖLÜM: CANLI GRAFİK + SWAP (KOLAY AL/SAT) WİDGETI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SOL: CANLI GRAFİK ALANI (8 Kolon) */}
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-5 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-terminal-text text-sm">UMY / USD Canlı Fiyat Grafiği</span>
                <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-extrabold text-amber-600 dark:text-amber-300">
                  +24.0%
                </span>
              </div>

              {/* Grafik Aralık & Mum/Çizgi Butonları (1S, 24S, 7G, 1AY) */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <div className="flex rounded-xl border border-terminal-border bg-terminal-bg p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setChartRange("1d");
                      setChartInterval("15m");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartRange === "1d" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    24S
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChartRange("5d");
                      setChartInterval("1h");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartRange === "5d" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    7G
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChartRange("1mo");
                      setChartInterval("1d");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartRange === "1mo" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    1AY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChartRange("1y");
                      setChartInterval("1wk");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartRange === "1y" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    1YIL
                  </button>
                </div>

                <div className="flex rounded-xl border border-terminal-border bg-terminal-bg p-0.5 ml-2 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setChartMode("candle")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartMode === "candle" ? "bg-cyan-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    Mum
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("line")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartMode === "line" ? "bg-cyan-500 text-slate-950 font-bold shadow-xs" : "text-terminal-muted hover:text-terminal-text"
                    }`}
                  >
                    Çizgi
                  </button>
                </div>
              </div>
            </div>

            {/* Fiyat Açılış & Zirve Bilgileri */}
            <div className="grid grid-cols-2 gap-3 py-3 text-xs sm:grid-cols-4 text-terminal-muted">
              <div>
                <span className="block text-[10px] uppercase">Grafik Açılış (Open)</span>
                <span className="font-bold text-terminal-text tabular-nums">
                  ${INITIAL_PRICE_USD.toFixed(6)} ({INITIAL_PRICE_TRY.toFixed(4)} TL)
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Zirve (High)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ${HIGH_24H_USD.toFixed(6)} ({(HIGH_24H_USD * 40.3).toFixed(4)} TL)
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Dip (Low)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  ${LOW_24H_USD.toFixed(6)} ({(LOW_24H_USD * 40.3).toFixed(4)} TL)
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Hacim (Vol)</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
                  {(VOLUME_24H_UMY / 1_000_000).toFixed(2)}M UMY (${VOLUME_24H_USD.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Grafiğin Render Alanı (Temaya göre hafif veya koyu) */}
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-terminal-border bg-terminal-bg/50 p-2">
              {isChartLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-terminal-muted">
                  Mum verileri yükleniyor...
                </div>
              ) : (
                <svg className="h-full w-full" viewBox="0 0 800 260" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Arka plan ızgarası */}
                  <line x1="0" y1="65" x2="800" y2="65" stroke="currentColor" className="text-terminal-border/50" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="130" x2="800" y2="130" stroke="currentColor" className="text-terminal-border/50" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="195" x2="800" y2="195" stroke="currentColor" className="text-terminal-border/50" strokeDasharray="4 4" strokeWidth="0.8" />

                  {/* Fiyat Referans Seviyeleri */}
                  <text x="740" y="60" fill="currentColor" className="text-terminal-muted text-[10px]" textAnchor="end">
                    ${HIGH_24H_USD.toFixed(6)}
                  </text>
                  <text
                    x="740"
                    y="125"
                    fill={TICK_DIRECTION === "down" ? "#F43F5E" : "#10B981"}
                    className="text-[10px] font-bold"
                    textAnchor="end"
                  >
                    ${CURRENT_PRICE_USD.toFixed(6)} (Son)
                  </text>
                  <text x="740" y="190" fill="currentColor" className="text-terminal-muted text-[10px]" textAnchor="end">
                    ${INITIAL_PRICE_USD.toFixed(6)} (Açılış)
                  </text>

                  {/* Alan Dolgusu & Fiyat Eğrisi */}
                  <path d={areaPathD} fill="url(#chartLineGrad)" />
                  <path d={linePathD} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Mum Grafiği Çubukları */}
                  {chartMode === "candle" && (
                    <g>
                      {CANDLES.map((c, idx) => {
                        const yHigh = yForPrice(c.high);
                        const yLow = yForPrice(c.low);
                        const yOpen = yForPrice(c.open);
                        const yClose = yForPrice(c.close);
                        const top = Math.min(yOpen, yClose);
                        const height = Math.max(3, Math.abs(yClose - yOpen));
                        const color = c.isUp ? "#10B981" : "#F43F5E";
                        return (
                          <g key={idx}>
                            <line x1={c.x} y1={yHigh} x2={c.x} y2={yLow} stroke={color} strokeWidth="1.5" />
                            <rect x={c.x - 6} y={top} width="12" height={height} fill={color} rx="2" />
                          </g>
                        );
                      })}
                      {/* Canlı titreşen anlık fiyat noktası */}
                      <circle
                        cx="780"
                        cy={yForPrice(CURRENT_PRICE_USD)}
                        r="4.5"
                        fill={TICK_DIRECTION === "down" ? "#F43F5E" : "#10B981"}
                        className="animate-ping"
                      />
                      <circle
                        cx="780"
                        cy={yForPrice(CURRENT_PRICE_USD)}
                        r="3.5"
                        fill={TICK_DIRECTION === "down" ? "#FB7185" : "#34D399"}
                      />
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Alt Grafiği Açıklama Notu */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-terminal-muted">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                Umay Koruyucu Fiyat Motoru • Topluluk Likiditesi Kilitli
              </span>
              <span>
                Lansman: ${INITIAL_PRICE_USD.toFixed(6)} ({INITIAL_PRICE_TRY.toFixed(4)} TL) • Mevcut: {CHANGE_PCT_24H >= 0 ? "+" : ""}{CHANGE_PCT_24H.toFixed(2)}%
              </span>
            </div>

            {/* Canlı Topluluk Takas Akışı */}
            <div className="mt-4 border-t border-terminal-border/60 pt-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-terminal-text">Canlı Topluluk Takas Akışı</span>
                  <span className="text-[10px] text-terminal-muted">({HOLDERS_COUNT} Cüzdan Sahibi • Mikrocap)</span>
                </div>
                <span className="text-[10px] text-terminal-muted">Otomatik Eşleşen İşlemler</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {RECENT_TRADES.slice(0, 3).map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between p-2 rounded-xl border border-terminal-border bg-terminal-bg/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tr.type === "buy"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {tr.type === "buy" ? "ALIŞ" : "SATIŞ"}
                      </span>
                      <span className="font-mono text-[11px] text-terminal-muted">{tr.wallet}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-terminal-text tabular-nums">{tr.amountUmy.toLocaleString()} UMY</span>
                      <span className="block text-[10px] text-terminal-muted tabular-nums">{formatMoney(tr.amountUsd, "USD")} • {tr.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ANLIK PİYASA DEĞERİ (MARKET CAP) HESAPLAYICI & GÖSTERGESİ */}
          <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-terminal-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <h3 className="font-bold text-terminal-text text-sm">
                  Anlık Piyasa Değeri (Market Cap) Hesaplayıcı
                </h3>
              </div>
              <span className="text-xs text-terminal-muted font-mono">
                Formül: Fiyat × Dolaşımdaki Arz
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-terminal-border bg-terminal-bg/60 p-4 shadow-xs">
                <span className="block text-[11px] uppercase text-terminal-muted font-medium">Toplam &amp; Dolaşım Arzı</span>
                <span className="mt-1 block text-lg font-black text-terminal-text tabular-nums">
                  1.000.000.000 UMY
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  %100 Dolaşımda (Adil Lansman)
                </span>
              </div>

              <div className="rounded-2xl border border-terminal-border bg-terminal-bg/60 p-4 shadow-xs">
                <span className="block text-[11px] uppercase text-terminal-muted font-medium">Seçili Birim Piyasa Değeri</span>
                <span className="mt-1 block text-lg font-black text-cyan-600 dark:text-cyan-300 tabular-nums">
                  {formatMoney(MARKET_CAP_USD, "USD")}
                </span>
                <span className="text-[11px] text-terminal-muted">
                  ({displayCurrency}) Dolaşımdaki Tüm Tokenler
                </span>
              </div>

              <div className="rounded-2xl border border-terminal-border bg-terminal-bg/60 p-4 shadow-xs">
                <span className="block text-[11px] uppercase text-terminal-muted font-medium">Özet / Kısaltılmış</span>
                <span className="mt-1 block text-lg font-black text-amber-500 dark:text-amber-400 tabular-nums">
                  {formatCompactMoney(MARKET_CAP_USD, "USD")}
                </span>
                <span className="text-[11px] text-terminal-muted">
                  ~502.966,15 TL Karşılığı
                </span>
              </div>
            </div>

            {/* Dinamik Portföy Değer Simülatörü */}
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-terminal-text">Portföyünüzdeki Token:</span>
                  <input
                    type="number"
                    value={calcTokens}
                    onChange={(e) => setCalcTokens(e.target.value)}
                    className="w-36 rounded-xl border border-terminal-border bg-terminal-bg px-3 py-1.5 text-xs font-bold text-terminal-text outline-none focus:border-amber-400 shadow-xs"
                    placeholder="Token miktarı"
                  />
                  <span className="text-xs font-bold text-amber-500 dark:text-amber-400">UMY</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-terminal-muted">Hesaplanan Değer:</span>
                  <span className="font-extrabold text-cyan-600 dark:text-cyan-300 tabular-nums">
                    {formatMoney(calcValueUsd, "USD")}
                  </span>
                  <span className="text-terminal-border">•</span>
                  <span className="font-extrabold text-amber-500 dark:text-amber-400 tabular-nums">
                    {calcValueTry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: KOLAY AL/SAT (SWAP) WIDGETI (4 Kolon) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-terminal-panel via-terminal-panel to-amber-500/5 p-6 shadow-xl backdrop-blur-md">
            {/* Widget Başlık */}
            <div className="flex items-center justify-between border-b border-terminal-border/80 pb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-base font-black text-terminal-text tracking-wide">
                  Kolay Al / Sat (Swap)
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Canlı Likidite
              </span>
            </div>

            {/* Alış / Satış Sekmesi */}
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-terminal-border bg-terminal-bg p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setSwapAction("buy")}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                  swapAction === "buy"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm font-bold"
                    : "text-terminal-muted hover:text-terminal-text"
                }`}
              >
                UMY Satın Al
              </button>
              <button
                type="button"
                onClick={() => setSwapAction("sell")}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                  swapAction === "sell"
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm font-bold"
                    : "text-terminal-muted hover:text-terminal-text"
                }`}
              >
                UMY Sat
              </button>
            </div>

            {/* Miktar Girişi (Senin Ödediğin) */}
            <div className="mt-4 rounded-2xl border border-terminal-border bg-terminal-bg p-3.5 focus-within:border-amber-400/80 transition-all shadow-xs">
              <div className="flex items-center justify-between text-xs text-terminal-muted mb-1">
                <span>{swapAction === "buy" ? "Ödeyeceğiniz Tutar" : "Satacağınız Miktar"}</span>
                <span className="text-[11px]">Bakiye: Sınırsız Demo</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full bg-transparent text-xl font-black text-terminal-text outline-none tabular-nums placeholder:text-terminal-muted/40"
                  placeholder="0.0"
                />
                {swapAction === "buy" ? (
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value as "USDT" | "TRY" | "USD")}
                    className="rounded-xl border border-terminal-border bg-terminal-panel px-2.5 py-1.5 text-xs font-bold text-amber-500 dark:text-amber-300 outline-none cursor-pointer shadow-xs"
                  >
                    <option value="USDT">USDT</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                ) : (
                  <span className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                    UMY
                  </span>
                )}
              </div>
            </div>

            {/* Yön Değiştirme Butonu */}
            <div className="flex justify-center -my-2.5 relative z-10">
              <button
                type="button"
                onClick={() => setSwapAction(swapAction === "buy" ? "sell" : "buy")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-terminal-border bg-terminal-panel text-amber-500 dark:text-amber-400 shadow-md transition-transform hover:rotate-180 hover:border-amber-400"
                title="Yönü Değiştir"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Tahmini Alınan Miktar */}
            <div className="mt-1 rounded-2xl border border-terminal-border bg-terminal-bg p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-terminal-muted mb-1">
                <span>Tahmini Alacağınız Miktar</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Anlık Çevrim</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-300 tabular-nums truncate">
                  {estimatedOutput.toLocaleString()}
                </span>
                <span className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                  {swapAction === "buy" ? "UMY" : payCurrency}
                </span>
              </div>
            </div>

            {/* Slippage & Komisyon Ayarları (%0.1 - %0.5) */}
            <div className="mt-4 space-y-2 border-t border-terminal-border/70 pt-3 text-xs">
              <div className="flex items-center justify-between text-terminal-muted">
                <span>Önerilen Slippage:</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlippage(val)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                        slippage === val
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "border border-terminal-border bg-terminal-bg text-terminal-muted hover:text-terminal-text"
                      }`}
                    >
                      %{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-terminal-muted">
                <span>Platform Komisyonu:</span>
                <span className="font-semibold text-terminal-text">%{platformFeePct}</span>
              </div>

              <div className="flex items-center justify-between text-terminal-muted">
                <span>Ağ / Blokzincir:</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">Solana / EVM Bridge</span>
              </div>
            </div>

            {/* Al/Sat Butonu */}
            <button
              type="button"
              disabled={isSwapping || numInput <= 0}
              onClick={handleSwapExecute}
              className={`mt-5 w-full rounded-2xl py-3.5 text-sm font-black tracking-wide text-slate-950 transition-all shadow-md active:scale-98 ${
                swapAction === "buy"
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 shadow-amber-500/20"
                  : "bg-gradient-to-r from-rose-400 to-red-500 hover:brightness-105 shadow-red-500/20 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSwapping ? "İşlem Gerçekleştiriliyor..." : swapAction === "buy" ? "UMY Satın Al" : "UMY Bozdur"}
            </button>

            {/* Swap Başarı Bildirimi */}
            {swapResult && (
              <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>İşlem Başarılı!</span>
                </div>
                <p className="mt-1 text-[11px] text-terminal-text">{swapResult.message}</p>
                <div className="mt-2 font-mono text-[10px] text-terminal-muted truncate">
                  Tx Hash: {swapResult.txHash}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PROJE MİMARİSİ VE "KÖKLERDEN GELECEĞE" KARTLARI */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-terminal-border/80 pb-2">
          <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          <h2 className="text-xl font-black tracking-tight text-terminal-text">
            &ldquo;Köklerden Geleceğe&rdquo; — Proje Hikayesi ve Mimarisi
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Kart 1: İlham & Mitoloji */}
          <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-6 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
              <Shield className="h-5 w-5" />
              <h3 className="font-bold text-terminal-text text-sm">Umay Ana Felsefesi</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-terminal-muted">
              Eski Türk mitolojisinde bereketin, şansın ve koruyuculuğun sembolü olan &ldquo;Umay Ana&rdquo; felsefesinden ilham alınmıştır. Köklerden geleceğe uzanan dijital bir koruyucu güç olarak tasarlanmıştır.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Kültürel Miras &amp; Koruyucu Vizyon
            </div>
          </div>

          {/* Kart 2: Kurucu & Geliştirici Disiplini */}
          <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-6 shadow-sm hover:border-cyan-500/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Cpu className="h-5 w-5" />
              <h3 className="font-bold text-terminal-text text-sm">Bağımsız Geliştirici Disiplini</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-terminal-muted">
              Büyük fonların veya spekülatif şirketlerin desteği olmaksızın, SoftBridge Solutions bünyesinde bireysel geliştirici disipliniyle, minimal bütçeyle ve saf mühendislik tutkusuyla hayata geçirilmiştir.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
              SoftBridge Solutions Altyapısı
            </div>
          </div>

          {/* Kart 3: Adil Lansman & Felsefe */}
          <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-6 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
              <h3 className="font-bold text-terminal-text text-sm">Fair Launch &amp; Sıfır Manipülasyon</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-terminal-muted">
              Şişirilmiş VC yatırımları, gizli içeriden satışlar veya manipülatif ön satışlar barındırmaz. Tamamen adil lansman (Fair Launch), saf kod ve topluluk gücüne dayanan bağımsız bir utility/meme hibrit ekosistemidir.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              %100 Şeffaf &amp; Güvenli
            </div>
          </div>
        </div>

        {/* 4. SAYISAL VERİLER & TOKENOMICS DAĞILIM TABLOSU */}
        <div className="rounded-3xl border border-terminal-border bg-terminal-panel p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-terminal-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <h3 className="text-base font-bold text-terminal-text">
                UMY Sayısal Parametreleri &amp; Tokenomics Dağılımı
              </h3>
            </div>
            <span className="text-xs text-terminal-muted">1.000.000.000 UMY Toplam Arz</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sol: Dağılım Grafiği Çubukları */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-300">
                    <Lock className="h-3.5 w-3.5" /> Likidite Havuzu (Liquidity Pool)
                  </span>
                  <span className="text-terminal-text font-bold">%80 • 800.000.000 UMY</span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-terminal-border/50">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" style={{ width: "80%" }} />
                </div>
                <p className="mt-1 text-[11px] text-terminal-muted">
                  Kilitli / Yakılmış: Havuz manipülasyonlarına karşı korumalı.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                    <Flame className="h-3.5 w-3.5" /> Ekosistem &amp; Topluluk Ödülleri / Geliştirme
                  </span>
                  <span className="text-terminal-text font-bold">%20 • 200.000.000 UMY</span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-terminal-border/50">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" style={{ width: "20%" }} />
                </div>
                <p className="mt-1 text-[11px] text-terminal-muted">
                  Kullanıcı airdropları, stake ödülleri ve sürekli geliştirme fonu.
                </p>
              </div>
            </div>

            {/* Sağ: Sayısal Tablo Parametreleri */}
            <div className="rounded-2xl border border-terminal-border bg-terminal-bg/60 p-4 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-terminal-border/60 pb-1.5">
                <span className="text-terminal-muted">Başlangıç Listeleme Taban Fiyatı:</span>
                <span className="font-bold text-terminal-text tabular-nums">$0.000100 (0,0040 TL)</span>
              </div>
              <div className="flex justify-between border-b border-terminal-border/60 pb-1.5">
                <span className="text-terminal-muted">Mevcut Fiyat Seviyesi:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">$0.000124 (0,00496 TL) [+%24]</span>
              </div>
              <div className="flex justify-between border-b border-terminal-border/60 pb-1.5">
                <span className="text-terminal-muted">Ağ Uyumluluğu:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">Solana SPL / EVM Cross-Chain</span>
              </div>
              <div className="flex justify-between border-b border-terminal-border/60 pb-1.5">
                <span className="text-terminal-muted">Önerilen Slippage:</span>
                <span className="font-bold text-amber-500 dark:text-amber-400">%0.1 - %0.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Platform İşlem Komisyonu:</span>
                <span className="font-bold text-terminal-text">%0.3</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
