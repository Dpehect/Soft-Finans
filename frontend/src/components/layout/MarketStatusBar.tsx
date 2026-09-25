import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CircleDot } from "lucide-react";

import { useMarketStatus } from "../../hooks/useStocks";
import { useAlertsStore } from "../../store/alertsStore";
import { useQuotesStore } from "../../realtime/useQuotesStream";

function formatZone(now: Date, timeZone: string) {
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  });
}

function marketLabel(value: unknown): "OPEN" | "CLOSED" {
  const raw = String(value || "").toUpperCase();
  return raw.includes("OPEN") ? "OPEN" : "CLOSED";
}

function Dot({ tone }: { tone: "green" | "yellow" | "red" | "gray" }) {
  const cls =
    tone === "green"
      ? "text-emerald-400"
      : tone === "yellow"
        ? "text-amber-400"
        : tone === "red"
          ? "text-rose-400"
          : "text-gray-500";
  return <CircleDot className={`h-3.5 w-3.5 ${cls}`} fill="currentColor" />;
}

export function MarketStatusBar(_props: { tickerOverride?: string | null } = {}) {
  const { data: marketStatus } = useMarketStatus();
  const unreadAlerts = useAlertsStore((s) => s.unreadCount);
  const connectionState = useQuotesStore((s) => s.connectionState);
  const [now, setNow] = useState(() => new Date());
  const [lagMs, setLagMs] = useState(0);
  const lagRef = useRef(performance.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const nextNow = new Date();
      const currentPerf = performance.now();
      const drift = Math.max(0, currentPerf - lagRef.current - 1000);
      lagRef.current = currentPerf;
      setLagMs(Math.round(drift));
      setNow(nextNow);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const perfStats = useMemo(() => {
    const memoryApi = (performance as Performance & { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
    const heapMb = memoryApi?.usedJSHeapSize ? Math.round(memoryApi.usedJSHeapSize / (1024 * 1024)) : null;
    const heapPct =
      memoryApi?.usedJSHeapSize && memoryApi?.jsHeapSizeLimit
        ? Math.round((memoryApi.usedJSHeapSize / memoryApi.jsHeapSizeLimit) * 100)
        : null;
    const cpuHint = Math.min(99, Math.max(1, Math.round(lagMs / 5) + 1));
    return { heapMb, heapPct, cpuHint };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lagMs, now]);

  const marketPayload = (marketStatus ?? {}) as {
    marketState?: Array<{ marketStatus?: string }>;
    nseStatus?: string;
    nyseStatus?: string;
    nextOpenTime?: string;
    fallbackEnabled?: boolean;
  };

  const nseOpen = marketLabel(marketPayload.marketState?.[0]?.marketStatus ?? marketPayload.nseStatus);
  const nyseOpen = marketLabel(marketPayload.nyseStatus);
  const connectionTone =
    connectionState === "connected" ? "green" : connectionState === "connecting" ? "yellow" : "red";
  const connText =
    connectionState === "connected" ? "CONNECTED" : connectionState === "connecting" ? "DEGRADED" : "DISCONNECTED";

  return (
    <footer className="border-t border-terminal-border/70 bg-terminal-panel/80 px-4 py-1 text-xs text-terminal-muted backdrop-blur-sm">
      <div className="flex h-5 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-terminal-text">SoftBridge Finans</span>
          <span className="hidden sm:inline text-terminal-muted/60">•</span>
          <span className="hidden sm:inline text-[11px]">v1.7.0</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${nseOpen === "OPEN" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            <span>NSE: {nseOpen}</span>
          </span>
          <span className="text-terminal-muted/60">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${nyseOpen === "OPEN" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            <span>NYSE: {nyseOpen}</span>
          </span>
          {marketPayload.nextOpenTime ? (
            <span className="hidden md:inline text-terminal-muted/70">
              (Açılış: {String(marketPayload.nextOpenTime)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <Dot tone={connectionTone} />
            <span className="font-medium text-terminal-text">{connText}</span>
          </span>
          {unreadAlerts > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <Bell className="h-3 w-3" />
              <span>{unreadAlerts}</span>
            </span>
          ) : null}
          <span className="hidden lg:inline text-terminal-muted/70">
            {formatZone(now, "Europe/Istanbul")}
          </span>
        </div>
      </div>
    </footer>
  );
}
