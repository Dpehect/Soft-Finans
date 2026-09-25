import React from "react";
import { Compass, Zap, X, HelpCircle, CheckCircle2 } from "lucide-react";
import { useGuideStore } from "./guideStore";
import { SoftBridgeLogo } from "../common/SoftBridgeLogo";
import { useTranslation } from "../../lib/i18n";

export function WelcomePromptModal() {
  const { isWelcomePromptOpen, answerWelcome, closeWelcomePrompt, openHelp } = useGuideStore();
  const { t } = useTranslation();

  if (!isWelcomePromptOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/35 dark:bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-terminal-border/80 bg-terminal-panel shadow-2xl">
        {/* Glow effect on top border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-terminal-accent via-sky-400 to-indigo-500" />

        {/* Close button in corner */}
        <button
          onClick={closeWelcomePrompt}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-terminal-muted transition-colors hover:bg-terminal-bg hover:text-terminal-text"
          aria-label="Kapat"
          title="Kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header with Fox Logo */}
          <div className="mb-6 flex items-center gap-3.5">
            <SoftBridgeLogo size={38} className="shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-terminal-accent">
                SoftBridge Finans • Hoş Geldiniz
              </span>
              <h2 id="welcome-modal-title" className="text-xl font-bold text-terminal-text sm:text-2xl">
                {t("welcomeTitle", "Platformu Kullanmayı Biliyor musunuz?")}
              </h2>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-terminal-muted">
            {t("welcomeSubtitle", "Platformumuz; hisse analizleri, canlı mum grafikleri, yapay zeka piyasa raporları ve portföy simülasyonları sunan profesyonel bir finans portalıdır.")}
          </p>

          {/* Interactive Question Cards */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Option A: Hayır, Bilmiyorum / İlk Kez Kullanıyorum */}
            <button
              type="button"
              onClick={() => answerWelcome(false)}
              className="group relative flex flex-col justify-between rounded-2xl border-2 border-terminal-accent bg-terminal-accent/10 p-5 text-left transition-all hover:bg-terminal-accent/20 hover:shadow-lg hover:shadow-terminal-accent/10 active:scale-[0.98]"
            >
              <div className="absolute right-3.5 top-3.5 rounded-full bg-terminal-accent/20 p-1.5 text-terminal-accent">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-terminal-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                  ÖNERİLEN
                </span>
                <h3 className="mt-2.5 text-base font-bold text-terminal-text group-hover:text-terminal-accent">
                  {t("welcomeNo", "Hayır, İlk Kez Kullanıyorum")}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-terminal-muted">
                  {t("welcomeNoDesc", "Sitedeki her bölümü, butonları ve grafikleri adım adım tanıtan interaktif rehberi başlatır.")}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-terminal-accent">
                <span>{t("startGuide", "Rehberi Başlat")}</span>
                <span className="transition-transform group-hover:translate-x-1">➔</span>
              </div>
            </button>

            {/* Option B: Evet, Biliyorum */}
            <button
              type="button"
              onClick={() => answerWelcome(true)}
              className="group relative flex flex-col justify-between rounded-2xl border border-terminal-border/80 bg-terminal-bg/60 p-5 text-left transition-all hover:border-terminal-text/40 hover:bg-terminal-bg active:scale-[0.98]"
            >
              <div className="absolute right-3.5 top-3.5 rounded-full bg-terminal-panel p-1.5 text-terminal-muted group-hover:text-terminal-text">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="inline-block rounded-full border border-terminal-border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-terminal-muted">
                  DOĞRUDAN BAŞLA
                </span>
                <h3 className="mt-2.5 text-base font-bold text-terminal-text">
                  {t("welcomeYes", "Evet, Biliyorum")}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-terminal-muted">
                  {t("welcomeYesDesc", "Doğrudan işlem ve analiz ekranına geçin. İhtiyaç duyduğunuzda üst menüden rehbere ulaşabilirsiniz.")}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-terminal-muted group-hover:text-terminal-text">
                <span>{t("goToPlatform", "Platforma Geç")}</span>
                <span className="transition-transform group-hover:translate-x-1">➔</span>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-terminal-border/60 pt-4 text-xs text-terminal-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Dilediğiniz an üst bardaki <b>REHBER</b> veya <b>YARDIM</b> butonlarını kullanabilirsiniz.</span>
            </div>
            <button
              onClick={() => openHelp("sections")}
              className="inline-flex items-center gap-1 text-terminal-accent underline-offset-4 hover:underline"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Yardım Kılavuzunu İncele</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
