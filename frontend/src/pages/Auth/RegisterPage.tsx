import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { MarketTicker } from "../../components/MarketTicker";
import { StatusBar } from "../../components/StatusBar";
import { useAuth } from "../../contexts/AuthContext";
import { SoftBridgeLogo } from "../../components/common/SoftBridgeLogo";
import { passwordStrengthScore, validatePasswordStrength } from "../../lib/authSecurity";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { register, login, isLoading } = useAuth();
  const navigate = useNavigate();

  const strength = passwordStrengthScore(password);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (honeypot.trim()) {
      setError("KAYIT REDDEDİLDİ");
      return;
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.ok) {
      setError(passwordCheck.errors[0]?.toUpperCase() ?? "ŞİFRE YETERSİZ");
      return;
    }
    if (password !== confirmPassword) {
      setError("PASSWORDS DO NOT MATCH");
      return;
    }

    try {
      await register(email.trim(), password);
      await login(email.trim(), password);
      navigate("/equity/umy", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "REGISTRATION FAILED";
      setError(message.toUpperCase());
    }
  };

  return (
    <div className="ot-login-layout">
      <StatusBar left="SOFTBRIDGE FINANS" center="SYSTEM STATUS: ONLINE" centerDotColor="green" />

      <section className="ot-login-hero">
        <div className="ot-login-radar" aria-hidden="true" />
        <div className="ot-radar-sweep" aria-hidden="true" />

        <div className="ot-login-ticker-wrap">
          <MarketTicker />
        </div>

        <div className="ot-login-metrics">
          <span className="ot-value-up flex items-center gap-1.5"><span className="ot-live-dot ot-live-dot-green" />UPTIME 99.99%</span>
          <span className="ot-muted">|</span>
          <span className="ot-value-cyan flex items-center gap-1.5"><span className="ot-live-dot ot-live-dot-cyan" />LATENCY 1ms</span>
          <span className="ot-muted">|</span>
          <span className="ot-value-amber flex items-center gap-1.5"><span className="ot-live-dot ot-live-dot-amber" />SECURITY: ACTIVE</span>
        </div>

        <div className="ot-brand-block">
          <div className="ot-brand-logo-row">
            <SoftBridgeLogo size={56} className="ot-brand-logo" />
            <span className="ot-brand-kicker">KURUMSAL FİNANS &amp; ANALİZ PLATFORMU</span>
          </div>
          <h1 className="ot-brand-title">
            <span className="ot-brand-title-open">SOFTBRIDGE FINANS</span>
          </h1>
          <p className="ot-brand-subtitle">Create secure platform access.</p>
        </div>
      </section>

      <section className="ot-login-panel">
        <div className="ot-login-panel-inner">
          <header className="ot-stagger" style={{ ["--stagger-index" as string]: 1 }}>
            <div className="ot-panel-logo-wrap">
              <SoftBridgeLogo size={62} className="ot-panel-logo" />
            </div>
            <p className="ot-panel-kicker">NEW OPERATOR</p>
            <h2 className="ot-panel-title">REQUEST ACCESS</h2>
            <p className="ot-panel-subtitle">Güçlü şifre ile güvenli hesap oluşturun (rol otomatik atanır)</p>
            <span className="ot-panel-divider" />
          </header>

          <form className="ot-login-form" onSubmit={onSubmit}>
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <label className="ot-field-label ot-stagger" style={{ ["--stagger-index" as string]: 2 }} htmlFor="ot-register-email">
              EMAIL
            </label>
            <div className="ot-input-wrap ot-stagger" style={{ ["--stagger-index" as string]: 3 }}>
              <span className="ot-input-prompt">&gt;</span>
              <input
                id="ot-register-email"
                className="ot-input"
                placeholder="Enter email..."
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <label className="ot-field-label ot-stagger" style={{ ["--stagger-index" as string]: 4 }} htmlFor="ot-register-password">
              PASSWORD
            </label>
            <div className="ot-input-wrap ot-stagger" style={{ ["--stagger-index" as string]: 5 }}>
              <span className="ot-input-prompt">&gt;</span>
              <input
                id="ot-register-password"
                className="ot-input"
                type="password"
                placeholder="Min. 12 karakter, büyük/küçük, rakam, özel karakter"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
            {password ? (
              <div className="ot-stagger px-1 text-[10px] text-terminal-muted" style={{ ["--stagger-index" as string]: 5 }}>
                Şifre gücü: {strength}/5
              </div>
            ) : null}

            <label className="ot-field-label ot-stagger" style={{ ["--stagger-index" as string]: 6 }} htmlFor="ot-register-confirm-password">
              CONFIRM PASSWORD
            </label>
            <div className="ot-input-wrap ot-stagger" style={{ ["--stagger-index" as string]: 7 }}>
              <span className="ot-input-prompt">&gt;</span>
              <input
                id="ot-register-confirm-password"
                className="ot-input"
                type="password"
                placeholder="Confirm password..."
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="ot-login-submit ot-stagger" style={{ ["--stagger-index" as string]: 8 }} disabled={isLoading}>
              {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>

            {error ? <p className="ot-auth-error">{error}</p> : null}

            <footer className="ot-login-footer ot-stagger" style={{ ["--stagger-index" as string]: 9 }}>
              <p>
                Already registered? <Link to="/login">Access platform</Link>
              </p>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
