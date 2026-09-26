import { api } from "./base";

export type WalletEntry = { id: string; asset: "TRY" | "UMY"; amount: number; type: string; reference: string; note?: string | null; created_at: string };
export type WalletDeposit = { id: string; amount_try: number; reference: string; status: "pending" | "approved"; created_at: string };
export type WalletSnapshot = { balances: { TRY: number; UMY: number }; entries: WalletEntry[]; deposits: WalletDeposit[] };

export async function getWallet(): Promise<WalletSnapshot> {
  const { data } = await api.get<WalletSnapshot>("/wallet");
  return data;
}

export async function submitDeposit(amount_try: string, transfer_reference: string): Promise<void> {
  await api.post("/wallet/deposits", { amount_try, transfer_reference });
}

export async function placeWalletOrder(side: "buy" | "sell", amount: string): Promise<void> {
  await api.post("/wallet/orders", side === "buy" ? { side, amount_try: amount } : { side, amount_umy: amount });
}

export async function grantWalletAsset(email: string, asset: "TRY" | "UMY", amount: string, note?: string): Promise<void> {
  await api.post("/wallet/admin/grants", { email, asset, amount, note: note || undefined });
}

export type PendingDeposit = { id: string; email: string; amount_try: number; reference: string; created_at: string };

export async function getPendingDeposits(): Promise<PendingDeposit[]> {
  const { data } = await api.get<{ items: PendingDeposit[] }>("/wallet/admin/deposits");
  return data.items;
}

export async function approveDeposit(id: string): Promise<void> {
  await api.post(`/wallet/admin/deposits/${encodeURIComponent(id)}/approve`);
}
