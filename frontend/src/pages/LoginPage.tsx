import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { StatusBar } from "../components/StatusBar";
import { useAuth } from "../contexts/AuthContext";
import { SoftBridgeLogo } from "../components/common/SoftBridgeLogo";
import { RunningFox } from "../components/common/RunningFox";
import { LanguageSelector } from "../components/common/LanguageSelector";
import { useTranslation } from "../lib/i18n";
import { useSettingsStore } from "../store/settingsStore";
import { getAppVersion } from "../utils/constants";
import { getLoginLockoutMessage } from "../lib/authSecurity";

const TRANSITION_FLAG_KEY = "ot-terminal-transition";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const themeVariant = useSettingsStore((s) => s.themeVariant);
  const setThemeVariant = useSettingsStore((s) => s.setThemeVariant);
  const { t } = useTranslation();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberTerminal, setRememberTerminal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [dotIndex, setDotIndex] = useState(1);
  const [inputErrorFlash, setInputErrorFlash] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem("ot-login-user");
    if (remembered) {
      setUserId(remembered);
      setRememberTerminal(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticating) return;
    const timer = window.setInterval(() => {
      setDotIndex((prev) => (prev % 3) + 1);
    }, 320);
    return () => window.clearInterval(timer);
  }, [authenticating]);

  const authText = useMemo(() => `${t("connecting")}${".".repeat(dotIndex)}`, [dotIndex, t]);

  const triggerInputFlash = () => {
    setInputErrorFlash(true);
    window.setTimeout(() => setInputErrorFlash(false), 420);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!userId.trim() || !password) {
      setError("GEREKLİ ALANLARI DOLDURUN");
      triggerInputFlash();
      return;
    }

    if (!userId.includes("@")) {
      setError("GEÇERLİ BİR E-POSTA ADRESİ GİRİN");
      triggerInputFlash();
      return;
    }

    const lockout = getLoginLockoutMessage();
    if (lockout) {
      setError(lockout.toUpperCase());
      triggerInputFlash();
      return;
    }

    if (password.length > 128) {
      setError("GEÇERSİZ ŞİFRE");
      triggerInputFlash();
      return;
    }

    try {
      setAuthenticating(true);
      const startedAt = Date.now();
      await login(userId.trim(), password);

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < 1800) {
        await delay(1800 - elapsedMs);
      }

      if (rememberTerminal) {
        localStorage.setItem("ot-login-user", userId.trim());
      } else {
        localStorage.removeItem("ot-login-user");
      }

      sessionStorage.setItem(TRANSITION_FLAG_KEY, "1");
      window.dispatchEvent(new CustomEvent("ot-terminal-transition"));
      await delay(600);

      const redirectParam = new URLSearchParams(location.search).get("redirect");
      const fallback = (location.state as { from?: string } | undefined)?.from || "/home";
      navigate(redirectParam || fallback, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      const code = (err as { code?: string }).code ?? "";
      if (message && !code) {
        setError(message.toUpperCase());
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("HATALI E-POSTA VEYA ŞİFRE");
      } else if (code === "auth/too-many-requests") {
        setError("ÇOK FAZLA DENEME — LÜTFEN BEKLEYİN");
      } else if (code === "auth/network-request-failed") {
        setError("BAĞLANTI HATASI — İNTERNETİNİZİ KONTROL EDİN");
      } else {
        setError("KİMLİK DOĞRULAMA BAŞARISIZ OLDU");
      }
      triggerInputFlash();
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <div className="ot-login-unified-layout">
      {/* Running Fox authenticating overlay */}
      {authenticating || isLoading ? (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center rounded-3xl border border-terminal-border/80 bg-terminal-panel/95 p-8 shadow-2xl max-w-sm w-full mx-4">
            <RunningFox size="lg" showTrack={true} showParticles={true} />
            <div className="mt-4 flex flex-col items-center text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
                {t("connecting")}
              </p>
              <p className="mt-1 text-xs text-terminal-muted">
                {t("authSuccess")}
              </p>
              <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-terminal-border/50">
                <div className="h-full w-full bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Status Bar with No Prices */}
      <StatusBar left="SOFTBRIDGE FINANS" center={t("systemOnline")} centerDotColor="green" />

      {/* Ambient Animated Cyber Background */}
      <div className="ot-unified-bg-layer" aria-hidden="true">
        <div className="ot-unified-radar" />
        <div className="ot-unified-sweep" />
        <div className="ot-unified-glow-orange" />
        <div className="ot-unified-glow-blue" />
      </div>

      {/* Centered Main Area with Modern Glass Card */}
      <main className="ot-unified-main">
        <div className="ot-unified-card">
          <div className="ot-card-top-glow" />

          {/* Top Control Bar: Language Selector + Theme Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                {t("portalSecureAccess")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector Dropdown (TR, EN, DE, ES, PT) */}
              <LanguageSelector />

              {/* Theme switcher pills */}
              <div className="flex items-center rounded-lg border border-terminal-border bg-terminal-panel p-0.5 shadow-sm text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setThemeVariant("renkli")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
                    themeVariant === "renkli"
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md font-bold scale-[1.02] ring-1 ring-white/20"
                      : "text-terminal-muted hover:text-terminal-text"
                  }`}
                  title={t("themeColorful")}
                >
                  <span>🎨</span>
                  <span className="hidden sm:inline">{t("themeColorful").toUpperCase()}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeVariant("dengeli")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
                    themeVariant === "dengeli" || themeVariant === "terminal-noir" || themeVariant === "light-desk" || !themeVariant
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 shadow-sm font-bold scale-[1.02]"
                      : "text-terminal-muted hover:text-terminal-text"
                  }`}
                  title={t("themeBalanced")}
                >
                  <span>⚖️</span>
                  <span className="hidden sm:inline">{t("themeBalanced").toUpperCase()}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeVariant("dark")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
                    themeVariant === "dark" || themeVariant === "classic-bloomberg"
                      ? "bg-slate-900 text-cyan-400 border border-cyan-500/40 shadow-sm font-bold scale-[1.02]"
                      : "text-terminal-muted hover:text-terminal-text"
                  }`}
                  title={t("themeDark")}
                >
                  <span>🌙</span>
                  <span className="hidden sm:inline">{t("themeDark").toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Brand Header with Fox Emblem */}
          <div className="ot-unified-brand-header">
            <div className="ot-unified-logo-wrap">
              <SoftBridgeLogo size={58} className="ot-brand-logo" />
            </div>
            <div className="ot-unified-brand-text">
              <h1 className="ot-unified-title">{t("brandTitle")}</h1>
              <p className="ot-unified-kicker">{t("brandKicker")}</p>
              <p className="ot-unified-motto">{t("brandSubtitle")}</p>
            </div>
          </div>

          {/* Telemetry pill strip */}
          <div className="ot-unified-telemetry">
            <span className="ot-val-metric"><span className="ot-live-dot ot-live-dot-green" />{t("uptime")} 99.99%</span>
            <span className="ot-telemetry-sep">|</span>
            <span className="ot-val-metric"><span className="ot-live-dot ot-live-dot-cyan" />{t("latency")} 1ms</span>
            <span className="ot-telemetry-sep">|</span>
            <span className="ot-val-metric"><span className="ot-live-dot ot-live-dot-amber" />{t("securityActive")}</span>
          </div>

          <div className="ot-unified-divider" />

          {/* Form Header */}
          <div className="mb-2">
            <h2 className="text-base font-bold text-terminal-text tracking-wide">{t("loginTitle")}</h2>
            <p className="text-xs text-terminal-muted">{t("loginSubtitle")}</p>
          </div>

          {/* Login Form */}
          <form className="ot-login-form" onSubmit={onSubmit}>
            <label className="ot-field-label" htmlFor="ot-user-id">
              {t("emailOrUser")}
            </label>
            <div className={`ot-input-wrap ${inputErrorFlash ? "ot-input-flash" : ""}`}>
              <span className="ot-input-prompt">&gt;</span>
              <input
                id="ot-user-id"
                className="ot-input"
                placeholder={t("emailPlaceholder")}
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                autoComplete="username"
                disabled={authenticating || isLoading}
              />
            </div>

            <label className="ot-field-label" htmlFor="ot-password">
              {t("password")}
            </label>
            <div className={`ot-input-wrap ot-input-password-wrap ${inputErrorFlash ? "ot-input-flash" : ""}`}>
              <span className="ot-input-prompt">&gt;</span>
              <input
                id="ot-password"
                className="ot-input ot-password-input"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={authenticating || isLoading}
              />
              <button
                type="button"
                className="ot-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🔒" : "👁"}
              </button>
            </div>

            <div className="ot-options-row">
              <label className="ot-checkbox">
                <input type="checkbox" checked={rememberTerminal} onChange={(event) => setRememberTerminal(event.target.checked)} />
                <span className="ot-checkbox-mark" />
                <span>{t("rememberMe")}</span>
              </label>
              <Link to="/forgot-access" className="ot-forgot-link">{t("forgotPassword")}</Link>
            </div>

            <button type="submit" className="ot-login-submit" disabled={authenticating || isLoading}>
              {authenticating || isLoading ? authText : t("loginButton")}
            </button>

            {error ? <p className="ot-auth-error">{error}</p> : null}

            <p className="text-[10px] text-center text-terminal-muted mt-2 leading-relaxed">
              5 başarısız denemeden sonra hesap 15 dakika kilitlenir. Admin erişimi yalnızca yetkili e-posta ile sağlanır.
            </p>
          </form>

          {/* Card Footer */}
          <footer className="ot-unified-footer">
            <p>
              {t("newUser")} <Link to="/register" className="text-cyan-400 hover:underline font-semibold ml-1">{t("register")}</Link>
            </p>
            <p className="ot-login-meta">
              v{getAppVersion()} | SOFTBRIDGE FINANS
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
