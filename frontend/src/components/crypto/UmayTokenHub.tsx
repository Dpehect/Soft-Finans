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
  Info,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDisplayCurrency } from "../../hooks/useDisplayCurrency";
import { useStockHistory } from "../../hooks/useStocks";

import { UmayFoxLogo } from "./UmayFoxLogo";

// Umay Token Sikke Logosu (Göksel Koruyucu Tilki Sikkesi)
export function UmayLogo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return <UmayFoxLogo size={size} className={className} />;
}

export function UmayTokenHub() {
  const { formatMoney, formatCompactMoney } = useDisplayCurrency();

  // Fiyat ve tokenomics durumları
  const TOTAL_SUPPLY = 1_000_000_000;
  const CIRCULATING_SUPPLY = 1_000_000_000;
  const INITIAL_PRICE_USD = 0.0001;
  const CURRENT_PRICE_USD = 0.000124; // +24% artış
  const INITIAL_PRICE_TRY = 0.004;
  const CURRENT_PRICE_TRY = 0.00496; // +24% artış
  const CHANGE_PCT_24H = 24.0;
  const MARKET_CAP_USD = 12_480.50; // Küsüratlı ~12 bin dolar ($12,480.50)
  const MARKET_CAP_TRY = 502_966.15; // ~502.966,15 TL ($12.480,50 karşılığı)

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
  const { data: chartData, isLoading: isChartLoading } = useStockHistory("UMY-USD", chartRange, chartInterval);

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

  const handleSwapExecute = () => {
    if (numInput <= 0) return;
    setIsSwapping(true);
    setSwapResult(null);

    setTimeout(() => {
      const fakeHash = "0x" + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18);
      const outCurr = swapAction === "buy" ? "UMY" : payCurrency;
      setSwapResult({
        txHash: fakeHash,
        outputAmount: estimatedOutput,
        outputCurrency: outCurr,
        message:
          swapAction === "buy"
            ? `${estimatedOutput.toLocaleString()} UMY başarıyla cüzdanınıza aktarıldı!`
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
    <div className="w-full space-y-6 pb-12 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. ÜST HERO & CANLI BİLGİ BANDI (Mitolojik Altın & Gece Mavisi Zemin) */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#070b14] via-[#0b132b] to-[#0f172a] p-6 lg:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Arka plan ışık efektleri */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo & Başlık & Motto */}
          <div className="flex items-start gap-4">
            <div className="relative group cursor-pointer">
              <UmayLogo size={64} className="transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-slate-950">
                ✓
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white lg:text-3xl">
                  Umay <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-300 bg-clip-text text-transparent">(UMY)</span>
                </h1>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  Fair Launch
                </span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                  Solana / EVM
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-amber-300/90 italic">
                &ldquo;Köklerden Geleceğe&rdquo;
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300">
                Umay, dijital varlıklarınızı koruyan ve büyüten, köklerini tarihten alan bağımsız topluluk tokenidir.
              </p>
            </div>
          </div>

          {/* Fiyat & 24h Değişim Özeti */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 backdrop-blur-md">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Canlı Fiyat</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  ${CURRENT_PRICE_USD.toFixed(6)}
                </span>
                <span className="text-sm font-semibold text-amber-400 tabular-nums">
                  ({CURRENT_PRICE_TRY.toFixed(5)} ₺)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Başlangıç: <span className="text-slate-300">${INITIAL_PRICE_USD.toFixed(4)} (0,0040 TL)</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-700/80 hidden sm:block" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">24 Saatlik Artış</div>
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-base font-extrabold text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                +{CHANGE_PCT_24H.toFixed(1)}%
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-0.5">
                Güçlü Alış Baskısı
              </div>
            </div>

            <div className="h-10 w-px bg-slate-700/80 hidden sm:block" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Piyasa Değeri (MCAP)</div>
              <div className="text-lg font-bold text-cyan-300 tabular-nums mt-0.5">
                ${MARKET_CAP_USD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400">
                {MARKET_CAP_TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </div>
            </div>
          </div>
        </div>

        {/* Akıllı Kontrat Adresleri Hızlı Kopyalama */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4 text-xs">
          <span className="font-semibold text-slate-400">Ağ &amp; Kontrat:</span>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-slate-300">
            <span className="font-bold text-amber-400">Solana:</span>
            <span className="font-mono text-[11px] text-slate-400">UMY11...1111</span>
            <button
              type="button"
              onClick={() => copyToClipboard("UMY11111111111111111111111111111111111111111", "solana")}
              className="ml-1 text-slate-400 hover:text-white transition-colors"
              title="Solana Kontratını Kopyala"
            >
              {copiedSolana ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-slate-300">
            <span className="font-bold text-cyan-400">EVM:</span>
            <span className="font-mono text-[11px] text-slate-400">0x71c...5UMY</span>
            <button
              type="button"
              onClick={() => copyToClipboard("0x71c89073B25A7fB7F39281a8E649CeA6a0665UMY", "evm")}
              className="ml-1 text-slate-400 hover:text-white transition-colors"
              title="EVM Kontratını Kopyala"
            >
              {copiedEvm ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <Link
            to="/equity/stocks?symbol=UMY-USD"
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline"
          >
            İleri Düzey İşlem Masasında Aç <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 2. ORTA BÖLÜM: CANLI GRAFİK + SWAP (KOLAY AL/SAT) WİDGETI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SOL: CANLI GRAFİK ALANI (8 Kolon) */}
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white text-sm">UMY / USD Canlı Fiyat Grafiği</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-300">
                  +24.0%
                </span>
              </div>

              {/* Grafik Aralık & Mum/Çizgi Butonları (1S, 24S, 7G, 1AY) */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <div className="flex rounded-lg border border-slate-700 bg-slate-900/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setChartRange("1d");
                      setChartInterval("15m");
                    }}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartRange === "1d" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
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
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartRange === "5d" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
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
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartRange === "1mo" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
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
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartRange === "1y" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    1YIL
                  </button>
                </div>

                <div className="flex rounded-lg border border-slate-700 bg-slate-900/80 p-0.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setChartMode("candle")}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartMode === "candle" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Mum
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("line")}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      chartMode === "line" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Çizgi
                  </button>
                </div>
              </div>
            </div>

            {/* Fiyat Açılış & Zirve Bilgileri */}
            <div className="grid grid-cols-2 gap-3 py-3 text-xs sm:grid-cols-4 text-slate-400">
              <div>
                <span className="block text-[10px] uppercase">Grafik Açılış (Open)</span>
                <span className="font-bold text-white tabular-nums">$0.000100 (0,004 TL)</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Zirve (High)</span>
                <span className="font-bold text-emerald-400 tabular-nums">$0.000135 (0,0054 TL)</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Dip (Low)</span>
                <span className="font-bold text-rose-400 tabular-nums">$0.000098 (0,0039 TL)</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">24s Hacim (Vol)</span>
                <span className="font-bold text-cyan-300 tabular-nums">14.85M UMY</span>
              </div>
            </div>

            {/* Grafiğin Render Alanı */}
            <div className="relative h-72 w-full overflow-hidden rounded-lg border border-slate-800 bg-[#050811] p-2">
              {isChartLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Mum verileri yükleniyor...
                </div>
              ) : (
                <svg className="h-full w-full" viewBox="0 0 800 260" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Arka plan ızgarası */}
                  <line x1="0" y1="65" x2="800" y2="65" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="130" x2="800" y2="130" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="195" x2="800" y2="195" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />

                  {/* Fiyat Referans Seviyeleri */}
                  <text x="740" y="60" fill="#94A3B8" fontSize="10" textAnchor="end">0.000135</text>
                  <text x="740" y="125" fill="#F59E0B" fontSize="10" textAnchor="end">0.000124 (Son)</text>
                  <text x="740" y="190" fill="#94A3B8" fontSize="10" textAnchor="end">0.000100 (Açılış)</text>

                  {/* Alan Dolgusu & Fiyat Eğrisi */}
                  <path
                    d="M 20 200 Q 150 195 240 185 T 400 160 T 560 135 T 720 115 L 780 110 L 780 250 L 20 250 Z"
                    fill="url(#chartLineGrad)"
                  />
                  <path
                    d="M 20 200 Q 150 195 240 185 T 400 160 T 560 135 T 720 115 L 780 110"
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Mum Grafiği Çubukları (Örnek Temsili Bar Serisi: 0.000100'den 0.000124'e) */}
                  {chartMode === "candle" && (
                    <g>
                      {/* Bar 1 (Açılış 0.000100) */}
                      <line x1="50" y1="190" x2="50" y2="210" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="44" y="193" width="12" height="12" fill="#10B981" rx="1" />

                      {/* Bar 2 (Konsolidasyon) */}
                      <line x1="120" y1="185" x2="120" y2="205" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="114" y="188" width="12" height="10" fill="#10B981" rx="1" />

                      {/* Bar 3 (Dip Testi) */}
                      <line x1="190" y1="180" x2="190" y2="215" stroke="#F43F5E" strokeWidth="1.5" />
                      <rect x="184" y="186" width="12" height="16" fill="#F43F5E" rx="1" />

                      {/* Bar 4 (Umay Koruma Alışı) */}
                      <line x1="260" y1="165" x2="260" y2="195" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="254" y="170" width="12" height="20" fill="#10B981" rx="1" />

                      {/* Bar 5 (Köklerden Geleceğe Yükseliş) */}
                      <line x1="330" y1="150" x2="330" y2="180" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="324" y="155" width="12" height="22" fill="#10B981" rx="1" />

                      {/* Bar 6 */}
                      <line x1="400" y1="140" x2="400" y2="170" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="394" y="145" width="12" height="18" fill="#10B981" rx="1" />

                      {/* Bar 7 */}
                      <line x1="470" y1="130" x2="470" y2="155" stroke="#F43F5E" strokeWidth="1.5" />
                      <rect x="464" y="135" width="12" height="12" fill="#F43F5E" rx="1" />

                      {/* Bar 8 (Zirve Atılımı 0.000135) */}
                      <line x1="540" y1="80" x2="540" y2="140" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="534" y="95" width="12" height="35" fill="#10B981" rx="1" />

                      {/* Bar 9 */}
                      <line x1="610" y1="90" x2="610" y2="130" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="604" y="100" width="12" height="20" fill="#10B981" rx="1" />

                      {/* Bar 10 (Son Kapanış 0.000124 - +24%) */}
                      <line x1="680" y1="95" x2="680" y2="125" stroke="#10B981" strokeWidth="1.5" />
                      <rect x="674" y="105" width="12" height="15" fill="#10B981" rx="1" />

                      {/* Canlı Fiyat Noktası */}
                      <circle cx="780" cy="110" r="4.5" fill="#F59E0B" className="animate-ping" />
                      <circle cx="780" cy="110" r="3.5" fill="#FBBF24" />
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Alt Grafiği Açıklama Notu */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                Umay Koruyucu Fiyat Motoru • %80 Likidite Kilitli
              </span>
              <span>Lansman: $0.000100 (0,004 TL) • Mevcut: +24.0%</span>
            </div>
          </div>

          {/* ANLIK PİYASA DEĞERİ (MARKET CAP) HESAPLAYICI & GÖSTERGESİ */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  Anlık Piyasa Değeri (Market Cap) Hesaplayıcı
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Formül: Fiyat × Dolaşımdaki Arz
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="block text-[11px] uppercase text-slate-400 font-medium">Toplam &amp; Dolaşım Arzı</span>
                <span className="mt-1 block text-lg font-black text-white tabular-nums">
                  1.000.000.000 UMY
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  %100 Dolaşımda (Adil Lansman)
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="block text-[11px] uppercase text-slate-400 font-medium">USD Piyasa Değeri</span>
                <span className="mt-1 block text-lg font-black text-cyan-300 tabular-nums">
                  ${MARKET_CAP_USD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400">
                  Küsüratlı ~12 Bin Dolar ($12.480,50)
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="block text-[11px] uppercase text-slate-400 font-medium">TL Piyasa Değeri</span>
                <span className="mt-1 block text-lg font-black text-amber-400 tabular-nums">
                  {MARKET_CAP_TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </span>
                <span className="text-[11px] text-slate-400">
                  ~502.966,15 TL Karşılığı
                </span>
              </div>
            </div>

            {/* Dinamik Portföy Değer Simülatörü */}
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Portföyünüzdeki Token:</span>
                  <input
                    type="number"
                    value={calcTokens}
                    onChange={(e) => setCalcTokens(e.target.value)}
                    className="w-36 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-amber-400"
                    placeholder="Token miktarı"
                  />
                  <span className="text-xs font-bold text-amber-400">UMY</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Değeriniz:</span>
                  <span className="font-extrabold text-cyan-300 tabular-nums">
                    ${calcValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-extrabold text-amber-400 tabular-nums">
                    {calcValueTry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: KOLAY AL/SAT (SWAP) WIDGETI (4 Kolon) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#0b132b] via-[#070b14] to-[#0a1122] p-6 shadow-2xl backdrop-blur-md">
            {/* Widget Başlık */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-black text-white tracking-wide">
                  Kolay Al / Sat (Swap)
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                Canlı Likidite
              </span>
            </div>

            {/* Alış / Satış Sekmesi */}
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              <button
                type="button"
                onClick={() => setSwapAction("buy")}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  swapAction === "buy"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                UMY Satın Al
              </button>
              <button
                type="button"
                onClick={() => setSwapAction("sell")}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  swapAction === "sell"
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                UMY Sat
              </button>
            </div>

            {/* Miktar Girişi (Senin Ödediğin) */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 focus-within:border-amber-400/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{swapAction === "buy" ? "Ödeyeceğiniz Tutar" : "Satacağınız Miktar"}</span>
                <span className="text-[11px]">Bakiye: Sınırsız Demo</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full bg-transparent text-xl font-black text-white outline-none tabular-nums placeholder-slate-600"
                  placeholder="0.0"
                />
                {swapAction === "buy" ? (
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value as "USDT" | "TRY" | "USD")}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-amber-300 outline-none cursor-pointer"
                  >
                    <option value="USDT">USDT</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                ) : (
                  <span className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-300">
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-amber-400 shadow-md transition-transform hover:rotate-180 hover:border-amber-400"
                title="Yönü Değiştir"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Tahmini Alınan Miktar */}
            <div className="mt-1 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Tahmini Alacağınız Miktar</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Anlık Çevrim</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-black text-cyan-300 tabular-nums truncate">
                  {estimatedOutput.toLocaleString()}
                </span>
                <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-cyan-300">
                  {swapAction === "buy" ? "UMY" : payCurrency}
                </span>
              </div>
            </div>

            {/* Slippage & Komisyon Ayarları (%0.1 - %0.5) */}
            <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Önerilen Slippage:</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlippage(val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        slippage === val
                          ? "bg-amber-500 text-slate-950"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      %{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Platform Komisyonu:</span>
                <span className="font-semibold text-slate-300">%{platformFeePct}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Ağ / Blokzincir:</span>
                <span className="font-semibold text-cyan-300">Solana / EVM Bridge</span>
              </div>
            </div>

            {/* Al/Sat Butonu */}
            <button
              type="button"
              disabled={isSwapping || numInput <= 0}
              onClick={handleSwapExecute}
              className={`mt-5 w-full rounded-xl py-3.5 text-sm font-black tracking-wide text-slate-950 transition-all shadow-lg active:scale-98 ${
                swapAction === "buy"
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 shadow-amber-500/20"
                  : "bg-gradient-to-r from-rose-400 to-red-500 hover:brightness-110 shadow-red-500/20 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSwapping ? "İşlem Gerçekleştiriliyor..." : swapAction === "buy" ? "UMY Satın Al" : "UMY Bozdur"}
            </button>

            {/* Swap Başarı Bildirimi */}
            {swapResult && (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>İşlem Başarılı!</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{swapResult.message}</p>
                <div className="mt-2 font-mono text-[10px] text-slate-400 truncate">
                  Tx Hash: {swapResult.txHash}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PROJE MİMARİSİ VE "KÖKLERDEN GELECEĞE" KARTLARI */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-black tracking-tight text-white">
            &ldquo;Köklerden Geleceğe&rdquo; — Proje Hikayesi ve Mimarisi
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Kart 1: İlham & Mitoloji */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-5 shadow-md hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield className="h-5 w-5" />
              <h3 className="font-bold text-white text-sm">Umay Ana Felsefesi</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Eski Türk mitolojisinde bereketin, şansın ve koruyuculuğun sembolü olan &ldquo;Umay Ana&rdquo; felsefesinden ilham alınmıştır. Köklerden geleceğe uzanan dijital bir koruyucu güç olarak tasarlanmıştır.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
              Kültürel Miras &amp; Koruyucu Vizyon
            </div>
          </div>

          {/* Kart 2: Kurucu & Geliştirici Disiplini */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-5 shadow-md hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center gap-2 text-cyan-400">
              <Cpu className="h-5 w-5" />
              <h3 className="font-bold text-white text-sm">Bağımsız Geliştirici Disiplini</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Büyük fonların veya spekülatif şirketlerin desteği olmaksızın, SoftBridge Solutions bünyesinde bireysel geliştirici disipliniyle, minimal bütçeyle ve saf mühendislik tutkusuyla hayata geçirilmiştir.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400">
              SoftBridge Solutions Altyapısı
            </div>
          </div>

          {/* Kart 3: Adil Lansman & Felsefe */}
          <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-5 shadow-md hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center gap-2 text-emerald-400">
              <Award className="h-5 w-5" />
              <h3 className="font-bold text-white text-sm">Fair Launch &amp; Sıfır Manipülasyon</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Şişirilmiş VC yatırımları, gizli içeriden satışlar veya manipülatif ön satışlar barındırmaz. Tamamen adil lansman (Fair Launch), saf kod ve topluluk gücüne dayanan bağımsız bir utility/meme hibrit ekosistemidir.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              %100 Şeffaf &amp; Güvenli
            </div>
          </div>
        </div>

        {/* 4. SAYISAL VERİLER & TOKENOMICS DAĞILIM TABLOSU */}
        <div className="rounded-xl border border-slate-800 bg-[#070b14]/90 p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                UMY Sayısal Parametreleri &amp; Tokenomics Dağılımı
              </h3>
            </div>
            <span className="text-xs text-slate-400">1.000.000.000 UMY Toplam Arz</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sol: Dağılım Grafiği Çubukları */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Lock className="h-3.5 w-3.5" /> Likidite Havuzu (Liquidity Pool)
                  </span>
                  <span className="text-white">%80 • 800.000.000 UMY</span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" style={{ width: "80%" }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Kilitli / Yakılmış: Havuz manipülasyonlarına karşı korumalı.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Flame className="h-3.5 w-3.5" /> Ekosistem &amp; Topluluk Ödülleri / Geliştirme
                  </span>
                  <span className="text-white">%20 • 200.000.000 UMY</span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" style={{ width: "20%" }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Kullanıcı airdropları, stake ödülleri ve sürekli geliştirme fonu.
                </p>
              </div>
            </div>

            {/* Sağ: Sayısal Tablo Parametreleri */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Başlangıç Listeleme Taban Fiyatı:</span>
                <span className="font-bold text-white tabular-nums">$0.000100 (0,0040 TL)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Mevcut Fiyat Seviyesi:</span>
                <span className="font-bold text-emerald-400 tabular-nums">$0.000124 (0,00496 TL) [+%24]</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Ağ Uyumluluğu:</span>
                <span className="font-bold text-cyan-300">Solana SPL / EVM Cross-Chain</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Önerilen Slippage:</span>
                <span className="font-bold text-amber-300">%0.1 - %0.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform İşlem Komisyonu:</span>
                <span className="font-bold text-slate-200">%0.3</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
