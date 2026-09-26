import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FiatCurrency = "USDT" | "TRY" | "USD";
export type PaymentMethod = "balance" | "card" | "bank_transfer";

export type CoinOrder = {
  id: string;
  type: "buy" | "sell";
  umyAmount: number;
  fiatAmount: number;
  fiatCurrency: FiatCurrency;
  paymentMethod: PaymentMethod;
  priceUsd: number;
  feeFiat: number;
  status: "completed" | "failed";
  createdAt: string;
  txRef: string;
};

export type UserWallet = {
  umy: number;
  usdt: number;
  try: number;
  usd: number;
  orders: CoinOrder[];
};

const DEFAULT_WALLET: UserWallet = {
  umy: 0,
  usdt: 2_500,
  try: 100_000,
  usd: 500,
  orders: [],
};

function fiatKey(currency: FiatCurrency): keyof Pick<UserWallet, "usdt" | "try" | "usd"> {
  if (currency === "USDT") return "usdt";
  if (currency === "TRY") return "try";
  return "usd";
}

interface CoinWalletState {
  activeUserId: string | null;
  walletsByUser: Record<string, UserWallet>;
  setActiveUser: (userId: string | null) => void;
  getActiveWallet: () => UserWallet;
  executeBuy: (params: {
    payAmount: number;
    payCurrency: FiatCurrency;
    umyOut: number;
    priceUsd: number;
    feeFiat: number;
    paymentMethod: PaymentMethod;
  }) => { ok: true; order: CoinOrder } | { ok: false; error: string };
  executeSell: (params: {
    umyAmount: number;
    receiveCurrency: FiatCurrency;
    fiatOut: number;
    priceUsd: number;
    feeFiat: number;
  }) => { ok: true; order: CoinOrder } | { ok: false; error: string };
}

function ensureWallet(map: Record<string, UserWallet>, userId: string): UserWallet {
  if (!map[userId]) {
    return { ...DEFAULT_WALLET, orders: [] };
  }
  return map[userId];
}

export const useCoinWalletStore = create<CoinWalletState>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      walletsByUser: {},

      setActiveUser: (userId) => set({ activeUserId: userId }),

      getActiveWallet: () => {
        const { activeUserId, walletsByUser } = get();
        if (!activeUserId) return { ...DEFAULT_WALLET, orders: [] };
        return ensureWallet(walletsByUser, activeUserId);
      },

      executeBuy: ({ payAmount, payCurrency, umyOut, priceUsd, feeFiat, paymentMethod }) => {
        const userId = get().activeUserId;
        if (!userId) {
          return { ok: false, error: "İşlem için oturum açmanız gerekir." };
        }
        if (payAmount <= 0 || umyOut <= 0) {
          return { ok: false, error: "Geçerli bir tutar girin." };
        }

        const wallets = { ...get().walletsByUser };
        const wallet = { ...ensureWallet(wallets, userId), orders: [...ensureWallet(wallets, userId).orders] };
        const key = fiatKey(payCurrency);
        const totalDebit = payAmount + (paymentMethod === "balance" ? feeFiat : 0);

        if (paymentMethod === "balance" && wallet[key] < totalDebit) {
          return { ok: false, error: `${payCurrency} bakiyeniz yetersiz.` };
        }

        if (paymentMethod === "balance") {
          wallet[key] = Number((wallet[key] - totalDebit).toFixed(payCurrency === "TRY" ? 2 : 4));
        }
        wallet.umy = Number((wallet.umy + umyOut).toFixed(0));

        const order: CoinOrder = {
          id: `ord-${Date.now()}`,
          type: "buy",
          umyAmount: umyOut,
          fiatAmount: payAmount,
          fiatCurrency: payCurrency,
          paymentMethod,
          priceUsd,
          feeFiat,
          status: "completed",
          createdAt: new Date().toISOString(),
          txRef: `SB-${Date.now().toString(36).toUpperCase()}`,
        };
        wallet.orders = [order, ...wallet.orders].slice(0, 50);
        wallets[userId] = wallet;
        set({ walletsByUser: wallets });
        return { ok: true, order };
      },

      executeSell: ({ umyAmount, receiveCurrency, fiatOut, priceUsd, feeFiat }) => {
        const userId = get().activeUserId;
        if (!userId) {
          return { ok: false, error: "İşlem için oturum açmanız gerekir." };
        }
        if (umyAmount <= 0 || fiatOut <= 0) {
          return { ok: false, error: "Geçerli bir miktar girin." };
        }

        const wallets = { ...get().walletsByUser };
        const wallet = { ...ensureWallet(wallets, userId), orders: [...ensureWallet(wallets, userId).orders] };

        if (wallet.umy < umyAmount) {
          return { ok: false, error: "UMY bakiyeniz yetersiz." };
        }

        wallet.umy = Number((wallet.umy - umyAmount).toFixed(0));
        const key = fiatKey(receiveCurrency);
        wallet[key] = Number((wallet[key] + fiatOut - feeFiat).toFixed(receiveCurrency === "TRY" ? 2 : 4));

        const order: CoinOrder = {
          id: `ord-${Date.now()}`,
          type: "sell",
          umyAmount,
          fiatAmount: fiatOut,
          fiatCurrency: receiveCurrency,
          paymentMethod: "balance",
          priceUsd,
          feeFiat,
          status: "completed",
          createdAt: new Date().toISOString(),
          txRef: `SB-${Date.now().toString(36).toUpperCase()}`,
        };
        wallet.orders = [order, ...wallet.orders].slice(0, 50);
        wallets[userId] = wallet;
        set({ walletsByUser: wallets });
        return { ok: true, order };
      },
    }),
    { name: "softbridge_coin_wallet_v1" },
  ),
);
