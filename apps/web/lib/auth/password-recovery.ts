const LOCALES = ["ru", "en", "es", "it"] as const;

export type AuthLocale = (typeof LOCALES)[number];

export function isAuthLocale(value: string): value is AuthLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function toSafeRelativePath(input: string | null | undefined, fallback: string): string {
  const value = (input ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
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
