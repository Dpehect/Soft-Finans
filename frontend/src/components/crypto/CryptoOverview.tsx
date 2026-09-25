import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchCryptoCoinDetail, fetchCryptoMarkets, type CryptoMarketRow } from "../../api/client";
import { TerminalPanel } from "../terminal/TerminalPanel";
import { useDisplayCurrency } from "../../hooks/useDisplayCurrency";
import { useSettingsStore, type DisplayCurrency } from "../../store/settingsStore";
import { currencySymbol } from "../../lib/currency";

function pctClass(v: number): string {
  return v >= 0 ? "text-terminal-pos" : "text-terminal-neg";
}

export function CryptoOverview() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC-USD");

  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);
  const { formatMoney, formatCompactMoney } = useDisplayCurrency();

  const marketsQuery = useQuery({
    queryKey: ["crypto", "overview", query, sector],
    queryFn: () =>
      fetchCryptoMarkets({
        limit: 80,
        q: query.trim() || undefined,
        sector: sector === "all" ? undefined : sector,
        sortBy: "market_cap",
        sortOrder: "desc",
      }),
    staleTime: 20_000,
    refetchInterval: 20_000,
  });

  const selected = useMemo(() => {
    const rows = marketsQuery.data || [];
    return rows.find((row) => row.symbol === selectedSymbol) ?? rows[0] ?? null;
  }, [marketsQuery.data, selectedSymbol]);

  const detailQuery = useQuery({
    queryKey: ["crypto", "coin-detail", selected?.symbol],
    queryFn: () => fetchCryptoCoinDetail(selected?.symbol || "BTC-USD"),
    enabled: Boolean(selected?.symbol),
    staleTime: 20_000,
    refetchInterval: 20_000,
  });

  const rows: CryptoMarketRow[] = marketsQuery.data || [];

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <TerminalPanel title="Crypto Overview" subtitle="Market board + filters" bodyClassName="space-y-3 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coin"
              className="min-w-[220px] rounded border border-terminal-border bg-terminal-bg px-2 py-1 text-xs text-terminal-text"
            />
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="rounded border border-terminal-border bg-terminal-bg px-2 py-1 text-xs text-terminal-text"
            >
              <option value="all">All sectors</option>
              <option value="L1">L1</option>
              <option value="DeFi">DeFi</option>
              <option value="Memes">Memes</option>
              <option value="AI">AI</option>
              <option value="Gaming">Gaming</option>
              <option value="RWA">RWA</option>
            </select>
          </div>

          {/* Para Birimi Seçici (Tüm Coinler İçin) */}
          <div className="flex items-center gap-1 rounded border border-terminal-border bg-terminal-bg p-0.5 text-xs">
            <span className="px-1.5 text-[10px] text-terminal-muted font-bold">Birimi:</span>
            {(["USD", "TRY", "EUR", "GBP", "INR"] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setDisplayCurrency(curr as DisplayCurrency)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition-all ${
                  displayCurrency === curr
                    ? "bg-terminal-accent text-slate-950"
                    : "text-terminal-muted hover:text-terminal-text"
                }`}
              >
                {curr} ({currencySymbol(curr)})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-terminal-muted">
              <tr>
                <th className="text-left">Symbol</th>
                <th className="text-right">Price ({displayCurrency})</th>
                <th className="text-right">24h</th>
                <th className="text-right">Volume</th>
                <th className="text-left">Sector</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.symbol} className="border-t border-terminal-border/50">
                  <td>
                    <button
                      type="button"
                      className={`hover:underline ${selected?.symbol === row.symbol ? "text-terminal-accent" : "text-terminal-text"}`}
                      onClick={() => setSelectedSymbol(row.symbol)}
                    >
                      {row.symbol}
                    </button>
                  </td>
                  <td className="text-right font-mono font-medium">{formatMoney(row.price, "USD")}</td>
                  <td className={`text-right ${pctClass(row.change_24h)}`}>{row.change_24h.toFixed(2)}%</td>
                  <td className="text-right font-mono">{formatCompactMoney(row.volume_24h, "USD")}</td>
                  <td>{row.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalPanel>

      <TerminalPanel title="Coin Detail" subtitle={selected?.symbol || "Select a coin"} bodyClassName="space-y-2">
        {!detailQuery.data ? (
          <div className="text-xs text-terminal-muted">Loading detail...</div>
        ) : (
          <>
            <div className="text-xs text-terminal-text">{detailQuery.data.name}</div>
            <div className="text-2xl text-terminal-accent font-bold tabular-nums">
              {formatMoney(detailQuery.data.price, "USD")}
            </div>
            <div className={`text-xs ${pctClass(detailQuery.data.change_24h)}`}>{detailQuery.data.change_24h.toFixed(2)}%</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-terminal-muted">24h High</div>
                <div className="font-mono">{formatMoney(detailQuery.data.high_24h, "USD")}</div>
              </div>
              <div>
                <div className="text-terminal-muted">24h Low</div>
                <div className="font-mono">{formatMoney(detailQuery.data.low_24h, "USD")}</div>
              </div>
              <div>
                <div className="text-terminal-muted">Volume</div>
                <div className="font-mono">{formatCompactMoney(detailQuery.data.volume_24h, "USD")}</div>
              </div>
              <div>
                <div className="text-terminal-muted">Mkt Cap Proxy</div>
                <div className="font-mono">{formatCompactMoney(detailQuery.data.market_cap, "USD")}</div>
              </div>
            </div>
            <div className="text-xs text-terminal-muted">
              Sparkline points: {detailQuery.data.sparkline.length}
            </div>
          </>
        )}
      </TerminalPanel>
    </div>
  );
}
