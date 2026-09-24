import { api } from "./base";

export type MarketContextPeriod = "1M" | "3M" | "6M";

export interface MarketComparisonRow {
  symbol: string;
  status: "available" | "unavailable";
  reason: "missing_history" | "insufficient_overlap" | "provider_error" | null;
  start_date: string | null;
  end_date: string | null;
  anchor_latest_date: string | null;
  comparison_latest_date: string | null;
  observations: number | null;
  freshness: "current" | "stale" | null;
  anchor_return_pct: number | null;
  comparison_return_pct: number | null;
  relative_return_pp: number | null;
}

export interface MarketComparisonResponse {
  anchor: string;
  period: MarketContextPeriod;
  retrieved_at: string;
  data_source: "unified_history";
  return_basis: "native_quote_currency_unadjusted";
  method: "same_utc_date_daily_closes";
  comparisons: MarketComparisonRow[];
}

export async function compareMarketContext(
  anchor: string,
  comparisons: string[],
  period: MarketContextPeriod,
): Promise<MarketComparisonResponse> {
  const response = await api.post<MarketComparisonResponse>("/market-context/compare", { anchor, comparisons, period });
  return response.data;
}
