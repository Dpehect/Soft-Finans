const LOGIN_ATTEMPT_KEY = "ot_auth_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const COMMON_PASSWORDS = new Set(
  [
    "password123",
    "123456789012",
    "qwertyuiop12",
    "adminadmin12",
    "softbridge12",
  ].map((p) => p.toLowerCase()),
);

type LoginAttemptState = {
  failures: number;
  lockedUntil: number | null;
};

function readLoginAttempts(): LoginAttemptState {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPT_KEY);
    if (!raw) return { failures: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as LoginAttemptState;
    return {
      failures: Number(parsed.failures) || 0,
      lockedUntil: parsed.lockedUntil ?? null,
    };
  } catch {
    return { failures: 0, lockedUntil: null };
  }
}

function writeLoginAttempts(state: LoginAttemptState): void {
  localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(state));
}

export function getLoginLockoutMessage(): string | null {
  const state = readLoginAttempts();
  if (!state.lockedUntil) return null;
  const remaining = state.lockedUntil - Date.now();
  if (remaining <= 0) {
    writeLoginAttempts({ failures: 0, lockedUntil: null });
    return null;
  }
  const minutes = Math.ceil(remaining / 60000);
  return `Çok fazla başarısız deneme. ${minutes} dakika sonra tekrar deneyin.`;
}

export function assertLoginAllowed(): void {
  const message = getLoginLockoutMessage();
  if (message) {
    throw new Error(message);
  }
}

export function recordLoginFailure(): void {
  const state = readLoginAttempts();
  const failures = state.failures + 1;
  if (failures >= MAX_LOGIN_ATTEMPTS) {
    writeLoginAttempts({ failures, lockedUntil: Date.now() + LOCKOUT_MS });
    return;
  }
  writeLoginAttempts({ failures, lockedUntil: null });
}

export function clearLoginFailures(): void {
  localStorage.removeItem(LOGIN_ATTEMPT_KEY);
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) {
    return "Geçerli bir e-posta adresi girin.";
  }
  if (!EMAIL_RE.test(normalized)) {
    return "Geçerli bir e-posta adresi girin.";
  }
  const domain = normalized.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Geçici e-posta adresleri kabul edilmiyor.";
  }
  return null;
}

export type PasswordValidation = {
  ok: boolean;
  errors: string[];
};

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  if (password.length < 12) {
    errors.push("En az 12 karakter olmalı.");
  }
  if (password.length > 72) {
    errors.push("En fazla 72 karakter olabilir.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("En az bir küçük harf içermeli.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("En az bir büyük harf içermeli.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("En az bir rakam içermeli.");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("En az bir özel karakter içermeli (!@#$ vb.).");
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Bu şifre çok yaygın; daha güçlü bir şifre seçin.");
  }
  if (/(.)\1{3,}/.test(password)) {
    errors.push("Ardışık tekrarlayan karakterler kullanmayın.");
  }
  return { ok: errors.length === 0, errors };
}

export function passwordStrengthScore(password: string): number {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
}

/** Bot tuzak alanı doldurulmuşsa true döner (kayıt reddedilmeli). */
export function isHoneypotTripped(value: string): boolean {
  return value.trim().length > 0;
}
