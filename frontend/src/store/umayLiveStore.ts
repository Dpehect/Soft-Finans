import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UmayTrade {
  id: string;
  type: "buy" | "sell";
  amountUmy: number;
  amountUsd: number;
  priceUsd: number;
  wallet: string;
  time: string;
}

export interface UmayCandle {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isUp: boolean;
}

interface UmayLiveState {
  // Price & Valuations
  priceUsd: number;
  priceTry: number;
  openPriceUsd: number;
  initialPriceUsd: number;
  initialPriceTry: number;
  high24hUsd: number;
  low24hUsd: number;
  changePct24h: number;

  // Supply & Market Cap (Small team / indie microcap)
  totalSupply: number;
  circulatingSupply: number;
  marketCapUsd: number;
  marketCapTry: number;

  // Volume & Liquidity
  volume24hUmy: number;
  volume24hUsd: number;
  liquidityUsd: number;
  holdersCount: number;

  // Ticks & Realtime Feed
  tickDirection: "up" | "down" | "neutral";
  lastTickTime: number;
  recentTrades: UmayTrade[];
  candles: UmayCandle[];

  // Actions
  triggerTick: () => void;
  recordUserSwap: (type: "buy" | "sell", amountUmy: number, amountUsd: number) => void;
}

// Initial realistic values
const USD_TRY_RATE = 40.30;
const INITIAL_CIRCULATING = 100_649_193; // 100.65M UMY (~10% in circulation, 90% locked)
const INITIAL_USD = 0.000124; // Base price
const INITIAL_OPEN = 0.000100; // Launch open price (0,0040 TL)

// 10 Initial candles reflecting indie team launch growth (+24%)
const INITIAL_CANDLES: UmayCandle[] = [
  { x: 50, open: 0.000100, high: 0.000106, low: 0.000098, close: 0.000104, isUp: true },
  { x: 120, open: 0.000104, high: 0.000109, low: 0.000102, close: 0.000107, isUp: true },
  { x: 190, open: 0.000107, high: 0.000110, low: 0.000103, close: 0.000105, isUp: false },
  { x: 260, open: 0.000105, high: 0.000114, low: 0.000104, close: 0.000112, isUp: true },
  { x: 330, open: 0.000112, high: 0.000118, low: 0.000110, close: 0.000116, isUp: true },
  { x: 400, open: 0.000116, high: 0.000121, low: 0.000114, close: 0.000119, isUp: true },
  { x: 470, open: 0.000119, high: 0.000122, low: 0.000116, close: 0.000118, isUp: false },
  { x: 540, open: 0.000118, high: 0.000128, low: 0.000117, close: 0.000125, isUp: true },
  { x: 610, open: 0.000125, high: 0.000127, low: 0.000122, close: 0.000124, isUp: false },
  { x: 680, open: 0.000124, high: 0.000126, low: 0.000123, close: 0.000124, isUp: true },
];

const INITIAL_TRADES: UmayTrade[] = [
  { id: "tx-1", type: "buy", amountUmy: 85000, amountUsd: 10.54, priceUsd: 0.000124, wallet: "7xK9...3b1a", time: "Az önce" },
  { id: "tx-2", type: "buy", amountUmy: 150000, amountUsd: 18.60, priceUsd: 0.000124, wallet: "3mP2...9e4f", time: "1 dk önce" },
  { id: "tx-3", type: "sell", amountUmy: 35000, amountUsd: 4.33, priceUsd: 0.0001238, wallet: "9qA1...6c8d", time: "3 dk önce" },
  { id: "tx-4", type: "buy", amountUmy: 220000, amountUsd: 27.28, priceUsd: 0.000124, wallet: "2wE5...1t9p", time: "5 dk önce" },
  { id: "tx-5", type: "buy", amountUmy: 50000, amountUsd: 6.20, priceUsd: 0.000124, wallet: "5vL8...4r2k", time: "8 dk önce" },
];

export const useUmayLiveStore = create<UmayLiveState>()(
  persist(
    (set, get) => ({
      priceUsd: INITIAL_USD,
      priceTry: Number((INITIAL_USD * USD_TRY_RATE).toFixed(5)),
      openPriceUsd: INITIAL_OPEN,
      initialPriceUsd: INITIAL_OPEN,
      initialPriceTry: 0.0040,
      high24hUsd: 0.000135,
      low24hUsd: 0.000098,
      changePct24h: 24.0,

      totalSupply: 1_000_000_000,
      circulatingSupply: INITIAL_CIRCULATING,
      marketCapUsd: 12480.50,
      marketCapTry: 502966.15,

      volume24hUmy: 14850000,
      volume24hUsd: 1841.40,
      liquidityUsd: 4850.00,
      holdersCount: 142,

      tickDirection: "neutral",
      lastTickTime: Date.now(),
      recentTrades: INITIAL_TRADES,
      candles: INITIAL_CANDLES,

      triggerTick: () => {
        const state = get();
        const current = state.priceUsd;

        // Balanced organic micro-fluctuations in both positive (+) and negative (-) directions:
        // 50% probability upward tick, 50% downward tick
        const isUp = Math.random() < 0.50;
        
        // Micro step size between $0.0000001 and $0.0000004
        const delta = (Math.random() * 0.0000003 + 0.0000001) * (isUp ? 1 : -1);
        
        // Bounded realistic range for community token ($0.000116 - $0.000136)
        let nextPrice = current + delta;
        if (nextPrice < 0.000116) nextPrice = 0.000116 + Math.random() * 0.0000003;
        if (nextPrice > 0.000136) nextPrice = 0.000136 - Math.random() * 0.0000003;

        // Clean precision to 7 decimals
        nextPrice = Number(nextPrice.toFixed(7));
        const priceTry = Number((nextPrice * USD_TRY_RATE).toFixed(5));
        const changePct24h = Number((((nextPrice - state.openPriceUsd) / state.openPriceUsd) * 100).toFixed(2));
        const marketCapUsd = Number((nextPrice * state.circulatingSupply).toFixed(2));
        const marketCapTry = Number((marketCapUsd * USD_TRY_RATE).toFixed(2));
        const high24hUsd = Math.max(state.high24hUsd, nextPrice);
        const low24hUsd = Math.min(state.low24hUsd, nextPrice);

        // Micro-trade generation
        const tradeAmountUmy = Math.floor(Math.random() * 80000) + 15000;
        const tradeAmountUsd = Number((tradeAmountUmy * nextPrice).toFixed(2));
        const tradeWallet = `${Math.floor(Math.random() * 9 + 1)}x${Math.random().toString(36).substring(2, 4)}...${Math.random().toString(36).substring(2, 6)}`;
        
        const newTrade: UmayTrade = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          type: isUp ? "buy" : "sell",
          amountUmy: tradeAmountUmy,
          amountUsd: tradeAmountUsd,
          priceUsd: nextPrice,
          wallet: tradeWallet,
          time: "Az önce",
        };

        const updatedTrades = [newTrade, ...state.recentTrades.slice(0, 5)];

        // Update the 10th candle with live real-time price
        const updatedCandles = [...state.candles];
        const lastIdx = updatedCandles.length - 1;
        if (lastIdx >= 0) {
          const lastCandle = { ...updatedCandles[lastIdx] };
          lastCandle.close = nextPrice;
          lastCandle.high = Math.max(lastCandle.high, nextPrice);
          lastCandle.low = Math.min(lastCandle.low, nextPrice);
          lastCandle.isUp = nextPrice >= lastCandle.open;
          updatedCandles[lastIdx] = lastCandle;
        }

        const volume24hUmy = state.volume24hUmy + tradeAmountUmy;
        const volume24hUsd = Number((volume24hUmy * nextPrice).toFixed(2));

        // Occasional holder increase (organic community growth)
        const newHolders = Math.random() < 0.05 ? state.holdersCount + 1 : state.holdersCount;

        set({
          priceUsd: nextPrice,
          priceTry,
          changePct24h,
          marketCapUsd,
          marketCapTry,
          high24hUsd,
          low24hUsd,
          volume24hUmy,
          volume24hUsd,
          holdersCount: newHolders,
          tickDirection: isUp ? "up" : "down",
          lastTickTime: Date.now(),
          recentTrades: updatedTrades,
          candles: updatedCandles,
        });
      },

      recordUserSwap: (type, amountUmy, amountUsd) => {
        const state = get();
        // Buying increases price slightly (bonding curve / AMM impact)
        const priceImpact = (amountUsd / state.liquidityUsd) * 0.000004;
        const nextPrice = type === "buy" ? state.priceUsd + priceImpact : Math.max(0.000115, state.priceUsd - priceImpact);
        
        const priceTry = Number((nextPrice * USD_TRY_RATE).toFixed(5));
        const changePct24h = Number((((nextPrice - state.openPriceUsd) / state.openPriceUsd) * 100).toFixed(1));
        const marketCapUsd = Number((nextPrice * state.circulatingSupply).toFixed(2));
        const marketCapTry = Number((marketCapUsd * USD_TRY_RATE).toFixed(2));
        const volume24hUmy = state.volume24hUmy + amountUmy;
        const volume24hUsd = Number((volume24hUmy * nextPrice).toFixed(2));

        const userTrade: UmayTrade = {
          id: `tx-user-${Date.now()}`,
          type,
          amountUmy,
          amountUsd,
          priceUsd: nextPrice,
          wallet: "Senin Cüzdanın (Demo)",
          time: "Az önce",
        };

        set({
          priceUsd: nextPrice,
          priceTry,
          changePct24h,
          marketCapUsd,
          marketCapTry,
          volume24hUmy,
          volume24hUsd,
          tickDirection: type === "buy" ? "up" : "down",
          lastTickTime: Date.now(),
          recentTrades: [userTrade, ...state.recentTrades.slice(0, 5)],
        });
      },
    }),
    {
      name: "umay_live_v2",
    }
  )
);

// Global live ticker service with singleton interval (runs in browser)
let liveTickerStarted = false;
export function initUmayLiveTicker() {
  if (typeof window === "undefined" || liveTickerStarted) return;
  liveTickerStarted = true;

  // Initial random interval between 2.5s and 4.2s
  const scheduleNextTick = () => {
    const delay = Math.floor(Math.random() * 1800) + 2400; // 2.4s - 4.2s
    setTimeout(() => {
      useUmayLiveStore.getState().triggerTick();
      scheduleNextTick();
    }, delay);
  };

  scheduleNextTick();
}

if (typeof window !== "undefined") {
  initUmayLiveTicker();
}
