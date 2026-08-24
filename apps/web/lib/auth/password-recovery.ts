const LOCALES = ["ru", "en", "es", "it"] as const;

const UNSAFE_PATH_CHARS = /[\s\x00-\x1f\x7f]/;

export type AuthLocale = (typeof LOCALES)[number];

export function isAuthLocale(value: string): value is AuthLocale {
  return (LOCALES as readonly string[]).includes(value);
}

function decodePathInput(input: string): string | null {
  try {
    return decodeURIComponent(input);
  } catch {
    return null;
  }
}

/** Reject open redirects, protocol-relative URLs, and whitespace/control-char bypasses. */
export function toSafeRelativePath(input: string | null | undefined, fallback: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return fallback;

  const decoded = decodePathInput(raw);
  if (decoded === null) return fallback;

  const value = decoded.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (UNSAFE_PATH_CHARS.test(value)) return fallback;

  const withoutLeadingSlashes = value.replace(/^\/+/, "");
  if (withoutLeadingSlashes.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(withoutLeadingSlashes)) return fallback;

  return value;
}

export function buildPasswordRecoveryRedirectUrl(origin: string, locale: AuthLocale): string {
  const callback = toSafeRelativePath(`/${locale}/reset-password`, "/en/reset-password");
  const params = new URLSearchParams({ callback, recovery: "1" });
  return `${origin}/api/auth/callback?${params.toString()}`;
}

export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (password.length < 8) return "too_short";
  if (password !== confirmPassword) return "mismatch";
  return null;
}
