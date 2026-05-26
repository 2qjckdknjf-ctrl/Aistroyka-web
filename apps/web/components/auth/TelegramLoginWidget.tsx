"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  botUsername: string | null;
  nextPath: string;
};

export function TelegramLoginWidget({ botUsername, nextPath }: Props) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const hostRef = useRef<HTMLDivElement | null>(null);
  const safeNext = useMemo(() => {
    if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) {
      return `/${locale}/dashboard`;
    }
    return nextPath;
  }, [locale, nextPath]);

  useEffect(() => {
    if (!hostRef.current || !botUsername) return;
    hostRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute(
      "data-auth-url",
      `${window.location.origin}/${locale}/telegram?next=${encodeURIComponent(safeNext)}`
    );
    script.setAttribute("data-request-access", "write");
    hostRef.current.appendChild(script);
  }, [botUsername, locale, safeNext]);

  if (!botUsername) {
    return (
      <p className="text-sm text-aistroyka-text-secondary" role="status">
        {t("telegramNotConfigured")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-aistroyka-text-secondary">{t("telegramLoginHint")}</p>
      <div ref={hostRef} />
    </div>
  );
}
