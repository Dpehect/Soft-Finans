import React from "react";

export interface GapInfo {
  previousClose: number;
  preMarketHigh: number;
  preMarketLow: number;
  openPrice: number;
  gapAmount: number;
  gapPercent: number;
  gapType: "gap_up" | "gap_down" | "flat";
  gapFilled: boolean;
}

interface GapBadgeProps {
  gap: GapInfo;
}

export const GapBadge: React.FC<GapBadgeProps> = ({ gap }) => (
  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
    gap.gapType === "gap_up" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
    gap.gapType === "gap_down" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30" :
    "bg-terminal-bg text-terminal-muted border border-terminal-border"
  }`}>
    <span className="opacity-70">GAP</span>
    <span>
      {gap.gapType === "gap_up" ? "▲" : gap.gapType === "gap_down" ? "▼" : "─"}
    </span>
    <span>
      {gap.gapPercent > 0 ? "+" : ""}{gap.gapPercent.toFixed(2)}%
    </span>
    {gap.gapFilled && (
      <span className="ml-1 text-[8px] bg-sky-500/15 text-sky-600 dark:text-sky-300 px-1 rounded border border-sky-500/30">
        FILLED
      </span>
    )}
  </div>
);
