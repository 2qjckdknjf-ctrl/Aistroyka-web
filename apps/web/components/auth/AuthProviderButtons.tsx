"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type OAuthProvider = "apple" | "google";

type Props = {
  nextPath: string;
  mode: "login" | "register";
  onContinueEmail: () => void;
  appleIntent?: "signin" | "link";
  hideEmailButton?: boolean;
};

function makeSafePath(path: string, locale: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return `/${locale}/dashboard`;
  }
  return path;
}

export function AuthProviderButtons({
  nextPath,
  mode,
  onContinueEmail,
  appleIntent = "signin",
  hideEmailButton = false,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const safeNext = useMemo(() => makeSafePath(nextPath, locale), [locale, nextPath]);
  const telegramStartHref = `/${locale}/telegram/start?next=${encodeURIComponent(safeNext)}`;

  async function continueWithOAuth(provider: OAuthProvider) {
    setOauthError(null);
    setOauthLoading(provider);
    const failedKey = provider === "apple" ? "oauthAppleFailed" : "oauthGoogleFailed";
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?callback=${encodeURIComponent(`/${locale}/dashboard`)}&next=${encodeURIComponent(safeNext)}&intent=${encodeURIComponent(appleIntent)}`;
      const result = appleIntent === "link"
        ? await (supabase.auth as { linkIdentity: (args: { provider: OAuthProvider; options: { redirectTo: string } }) => Promise<{ error?: { message?: string } | null }> }).linkIdentity({
            provider,
            options: { redirectTo },
          })
        : await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo },
          });
      if (result?.error) {
        setOauthError(result.error.message || t(failedKey));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t(failedKey);
      setOauthError(message);
    } finally {
      setOauthLoading(null);
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
          void continueWithOAuth("apple");
        }}
        loading={oauthLoading === "apple"}
      >
        {t("continueWithApple")}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          void continueWithOAuth("google");
        }}
        loading={oauthLoading === "google"}
      >
        {t("continueWithGoogle")}
      </Button>
      <a
        href={telegramStartHref}
        className="inline-flex min-h-[var(--aistroyka-touch-min)] w-full items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-button-secondary-border)] bg-[var(--aistroyka-button-secondary-bg)] px-[var(--aistroyka-space-4)] py-2.5 text-center text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-button-secondary-text)] transition-colors hover:bg-aistroyka-surface-raised"
      >
        {t("continueWithTelegram")}
      </a>
      {oauthError ? (
        <p className="text-sm text-aistroyka-error" role="alert">
          {oauthError}
        </p>
      ) : null}
    </div>
  );
}
