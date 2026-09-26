import { useCallback, useEffect, useState } from "react";
import { Building2, Check, Copy, Landmark, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";

import { approveDeposit, getPendingDeposits, getWallet, grantWalletAsset, placeWalletOrder, submitDeposit, type PendingDeposit, type WalletSnapshot } from "../api/wallet";
import { extractApiErrorMessage } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const IBAN = "TR45 0001 0016 9073 9943 7850 02";
const ACCOUNT_HOLDER = "YUNUS EMRE GÜRLEK";

function amount(value: number, asset: "TRY" | "UMY"): string {
  return asset === "TRY"
    ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value)
    : `${value.toLocaleString("tr-TR", { maximumFractionDigits: 8 })} UMY`;
}

export function WalletPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [pending, setPending] = useState<PendingDeposit[]>([]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderAmount, setOrderAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [reference, setReference] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAsset, setGrantAsset] = useState<"TRY" | "UMY">("UMY");
  const [grantAmount, setGrantAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const snapshot = await getWallet();
    setWallet(snapshot);
    if (isAdmin) setPending(await getPendingDeposits());
  }, [isAdmin]);

  useEffect(() => {
    void refresh().catch((err) => setError(extractApiErrorMessage(err, "Cüzdan yüklenemedi.")));
  }, [refresh]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice(success);
    } catch (err) {
      setError(extractApiErrorMessage(err, "İşlem tamamlanamadı."));
    } finally {
      setBusy(false);
    }
  };

  const copyIban = async () => {
    await navigator.clipboard.writeText(IBAN.replace(/ /g, ""));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-terminal-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-terminal-accent">Varlık Hesabı</p>
          <h1 className="mt-1 text-2xl font-bold text-terminal-text">Cüzdan ve UMY İşlemleri</h1>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-md border border-terminal-border px-3 py-2 text-xs font-semibold text-terminal-text hover:border-terminal-accent" disabled={busy}>Bakiyeyi yenile</button>
      </section>

      {notice ? <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-300">{notice}</p> : null}
      {error ? <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        {(["TRY", "UMY"] as const).map((asset) => (
          <div key={asset} className="border border-terminal-border bg-terminal-panel p-4">
            <div className="flex items-center justify-between text-terminal-muted"><span className="text-xs font-semibold">{asset === "TRY" ? "Türk Lirası" : "Umay Token"}</span><WalletCards className="h-4 w-4" /></div>
            <div className="mt-3 text-2xl font-bold tabular-nums text-terminal-text">{amount(wallet?.balances[asset] ?? 0, asset)}</div>
            <div className="mt-1 text-xs text-terminal-muted">Sunucu defteri bakiyesi</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-terminal-border bg-terminal-panel p-5">
          <div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-terminal-accent" /><h2 className="font-semibold text-terminal-text">Banka transferi ile bakiye yükle</h2></div>
          <p className="mt-2 text-sm text-terminal-muted">Transferden sonra referans numarasını gönderin. Bakiye, banka hareketi admin tarafından onaylandığında eklenir.</p>
          <dl className="mt-4 space-y-2 border-y border-terminal-border py-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-terminal-muted">Alıcı</dt><dd className="font-medium text-terminal-text">{ACCOUNT_HOLDER}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-terminal-muted">IBAN</dt><dd className="flex items-center gap-2 font-mono text-terminal-text">{IBAN}<button type="button" onClick={() => void copyIban()} title="IBAN'ı kopyala" className="text-terminal-accent">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></dd></div>
          </dl>
          <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { await submitDeposit(depositAmount, reference); setDepositAmount(""); setReference(""); }, "Transfer talebi onaya gönderildi."); }}>
            <input required inputMode="decimal" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} placeholder="Gönderilen tutar (TRY)" className="h-10 border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text" />
            <input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Banka transfer referansı" className="h-10 border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text" />
            <button disabled={busy} className="h-10 bg-terminal-accent px-4 text-sm font-semibold text-terminal-bg disabled:opacity-60">Transferi bildir</button>
          </form>
        </div>

        <div className="border border-terminal-border bg-terminal-panel p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-terminal-accent" /><h2 className="font-semibold text-terminal-text">UMY al / sat</h2></div>
          <div className="mt-4 grid grid-cols-2 border border-terminal-border p-1">
            {(["buy", "sell"] as const).map((item) => <button key={item} type="button" onClick={() => setSide(item)} className={`h-9 text-sm font-semibold ${side === item ? "bg-terminal-accent text-terminal-bg" : "text-terminal-muted"}`}>{item === "buy" ? "Al" : "Sat"}</button>)}
          </div>
          <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { await placeWalletOrder(side, orderAmount); setOrderAmount(""); }, side === "buy" ? "UMY alımı cüzdana işlendi." : "UMY satışı TRY bakiyesine işlendi."); }}>
            <label className="text-sm text-terminal-muted">{side === "buy" ? "Harcanacak TRY" : "Satılacak UMY"}</label>
            <input required inputMode="decimal" value={orderAmount} onChange={(event) => setOrderAmount(event.target.value)} placeholder={side === "buy" ? "Örn. 500" : "Örn. 1000"} className="h-11 border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text" />
            <p className="text-xs text-terminal-muted">Fiyat ve %0,3 işlem ücreti sunucuda hesaplanır.</p>
            <button disabled={busy} className="h-10 bg-terminal-accent px-4 text-sm font-semibold text-terminal-bg disabled:opacity-60">{side === "buy" ? "UMY satın al" : "UMY sat"}</button>
          </form>
        </div>
      </section>

      {isAdmin ? <section className="grid gap-6 lg:grid-cols-2 border-t border-terminal-border pt-6">
        <div className="border border-terminal-border bg-terminal-panel p-5"><h2 className="font-semibold text-terminal-text">Kullanıcıya varlık tanımla</h2><form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => { await grantWalletAsset(grantEmail, grantAsset, grantAmount); setGrantEmail(""); setGrantAmount(""); }, "Varlık kullanıcı cüzdanına tanımlandı."); }}><input required type="email" value={grantEmail} onChange={(event) => setGrantEmail(event.target.value)} placeholder="Kullanıcı e-postası" className="h-10 border border-terminal-border bg-terminal-bg px-3 text-sm" /><select value={grantAsset} onChange={(event) => setGrantAsset(event.target.value as "TRY" | "UMY")} className="h-10 border border-terminal-border bg-terminal-bg px-3 text-sm"><option value="UMY">UMY</option><option value="TRY">TRY</option></select><input required inputMode="decimal" value={grantAmount} onChange={(event) => setGrantAmount(event.target.value)} placeholder="Miktar" className="h-10 border border-terminal-border bg-terminal-bg px-3 text-sm" /><button disabled={busy} className="h-10 bg-terminal-accent px-4 text-sm font-semibold text-terminal-bg">Tanımla</button></form></div>
        <div className="border border-terminal-border bg-terminal-panel p-5"><h2 className="font-semibold text-terminal-text">Bekleyen banka transferleri</h2><div className="mt-3 space-y-2">{pending.length ? pending.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-terminal-border bg-terminal-bg p-3 text-sm"><div><div className="font-medium text-terminal-text">{item.email} · {amount(item.amount_try, "TRY")}</div><div className="font-mono text-xs text-terminal-muted">{item.reference}</div></div><button disabled={busy} onClick={() => void run(() => approveDeposit(item.id), "Transfer onaylandı ve TRY bakiyesi eklendi.")} className="border border-terminal-accent px-3 py-1.5 text-xs font-semibold text-terminal-accent">Onayla</button></div>) : <p className="text-sm text-terminal-muted">Bekleyen transfer yok.</p>}</div></div>
      </section> : null}

      <section className="border border-terminal-border bg-terminal-panel p-5"><h2 className="font-semibold text-terminal-text">İşlem geçmişi</h2><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-terminal-border text-xs text-terminal-muted"><tr><th className="pb-2">Zaman</th><th className="pb-2">İşlem</th><th className="pb-2">Varlık</th><th className="pb-2 text-right">Miktar</th></tr></thead><tbody>{wallet?.entries.length ? wallet.entries.map((entry) => <tr key={entry.id} className="border-b border-terminal-border/50"><td className="py-2 text-terminal-muted">{new Date(entry.created_at).toLocaleString("tr-TR")}</td><td className="py-2 text-terminal-text">{entry.type}</td><td className="py-2 text-terminal-muted">{entry.asset}</td><td className={`py-2 text-right font-medium ${entry.amount >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{entry.amount >= 0 ? "+" : ""}{amount(entry.amount, entry.asset)}</td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-terminal-muted">Henüz işlem yok.</td></tr>}</tbody></table></div></section>
    </main>
  );
}

export default WalletPage;
