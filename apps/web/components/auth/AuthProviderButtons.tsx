"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextRoute } from "@/lib/entry/entry-routing";

type Props = {
  nextPath: string;
  mode: "login" | "register";
  onContinueEmail: () => void;
  appleIntent?: "signin" | "link";
  hideEmailButton?: boolean;
};

export function AuthProviderButtons({
  nextPath,
  mode,
  onContinueEmail,
  appleIntent = "signin",
  hideEmailButton = false,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleError, setAppleError] = useState<string | null>(null);
  const safeNext = useMemo(() => {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://aistroyka.ai";
    return sanitizeNextRoute(nextPath, base, locale) ?? `/${locale}/dashboard`;
  }, [locale, nextPath]);
  const telegramStartHref = `/${locale}/telegram/start?next=${encodeURIComponent(safeNext)}`;

  async function continueWithApple() {
    setAppleError(null);
    setAppleLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?callback=${encodeURIComponent(`/${locale}/dashboard`)}&next=${encodeURIComponent(safeNext)}&intent=${encodeURIComponent(appleIntent)}`;
      const result = appleIntent === "link"
        ? await (supabase.auth as any).linkIdentity({
            provider: "apple",
            options: { redirectTo },
          })
        : await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: { redirectTo },
          });
      if (result?.error) {
        setAppleError(result.error.message || t("oauthAppleFailed"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("oauthAppleFailed");
      setAppleError(message);
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <div className="space-y-3" aria-label={t("authProviders")}>
      {!hideEmailButton ? (
        <Button type="button" variant="secondary" className="w-full" onClick={onContinueEmail}>
          {mode === "login" ? t("continueWithEmail") : t("continueWithEmailRegister")}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          void continueWithApple();
        }}
        loading={appleLoading}
      >
        {t("continueWithApple")}
      </Button>
      <a
        href={telegramStartHref}
        className="inline-flex min-h-[var(--aistroyka-touch-min)] w-full items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-button-secondary-border)] bg-[var(--aistroyka-button-secondary-bg)] px-[var(--aistroyka-space-4)] py-2.5 text-center text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-button-secondary-text)] transition-colors hover:bg-aistroyka-surface-raised"
      >
        {t("continueWithTelegram")}
      </a>
      {appleError ? (
        <p className="text-sm text-aistroyka-error" role="alert">
          {appleError}
        </p>
      ) : null}
    </div>
  );
}
