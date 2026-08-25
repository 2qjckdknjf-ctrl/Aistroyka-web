"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function formatCanonDate(now: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function weekNumber(now: Date): number {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function CanonFooterBar({ locale = "ru" }: { locale?: string }) {
  const t = useTranslations("canon");
  const now = new Date();

  return (
    <footer className="canon-footer-bar flex items-center justify-between gap-4 px-3 md:px-6">
      <div className="canon-footer-meta flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="hidden sm:inline">{t("todayLabel")}</span>
        <span className="sm:hidden">{t("todayLabel")}</span>
        <span>{formatCanonDate(now, locale)}</span>
        <span className="hidden text-[var(--canon-text-muted)] sm:inline">|</span>
        <span className="hidden sm:inline">{t("weekLabel")} {weekNumber(now)}</span>
      </div>
      <div className="canon-footer-status-row flex items-center gap-3 sm:gap-4">
        <span className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="canon-status-dot" aria-hidden />
          <span className="hidden sm:inline">{t("systemOk")}</span>
        </span>
        <Link
          href="/dashboard/support"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--canon-text-secondary)] hover:text-[var(--canon-text-primary)] sm:text-sm"
        >
          <Mail size={14} aria-hidden />
          <span className="hidden sm:inline">{t("feedback")}</span>
        </Link>
      </div>
    </footer>
  );
}
