"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type FinishState = "idle" | "submitting" | "success" | "error";

function safeParam(value: string | null): string | null {
  if (!value) return null;
  return value.trim().length > 0 ? value : null;
}

export function TelegramAuthCallbackClient() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<FinishState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      id: safeParam(params.get("id")),
      first_name: safeParam(params.get("first_name")),
      last_name: safeParam(params.get("last_name")),
      username: safeParam(params.get("username")),
      photo_url: safeParam(params.get("photo_url")),
      auth_date: safeParam(params.get("auth_date")),
      hash: safeParam(params.get("hash")),
      next: safeParam(params.get("next")) ?? `/${locale}/dashboard`,
      locale,
    }),
    [locale, params]
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!payload.id || !payload.first_name || !payload.auth_date || !payload.hash) {
        setState("error");
        setErrorMessage(t("telegramPayloadInvalid"));
        return;
      }
      setState("submitting");
      const response = await fetch("/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok || data.ok !== true) {
        setState("error");
        setErrorMessage(t("telegramAuthFailed"));
        return;
      }
      setState("success");
      const next = typeof data.next === "string" ? data.next : `/${locale}/dashboard`;
      router.replace(next);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [locale, payload, router, t]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md items-center px-aistroyka-4 py-aistroyka-8">
      <div className="w-full rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-6">
        <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">
          {t("continueWithTelegram")}
        </h1>
        {state === "submitting" || state === "idle" ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("telegramFinishing")}</p>
        ) : null}
        {state === "error" ? (
          <p className="mt-2 text-sm text-aistroyka-error">{errorMessage ?? t("telegramAuthFailed")}</p>
        ) : null}
      </div>
    </div>
  );
}
