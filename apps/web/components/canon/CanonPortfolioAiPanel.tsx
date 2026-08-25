"use client";

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CircleAlert,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Insight = {
  icon: typeof CircleAlert;
  tone: "danger" | "warning" | "info" | "success" | "purple";
  title: string;
};

export function CanonPortfolioAiPanel({
  projectCount = 0,
  highRiskCount = 0,
}: {
  projectCount?: number;
  highRiskCount?: number;
}) {
  const t = useTranslations("canon");

  const insights: Insight[] = [
    {
      icon: CircleAlert,
      tone: highRiskCount > 0 ? "danger" : "success",
      title:
        highRiskCount > 0
          ? t("aiInsightHighRisk", { count: highRiskCount })
          : t("aiInsightNoHighRisk"),
    },
    {
      icon: AlertTriangle,
      tone: "warning",
      title: t("aiInsightMediumRisk"),
    },
    {
      icon: BarChart3,
      tone: "info",
      title: t("aiInsightProgress"),
    },
    {
      icon: Wallet,
      tone: "success",
      title: t("aiInsightBudget"),
    },
    {
      icon: Calendar,
      tone: "purple",
      title: t("aiInsightDeadlines"),
    },
  ];

  const toneClass: Record<Insight["tone"], string> = {
    danger: "text-[var(--canon-danger)]",
    warning: "text-[var(--canon-warning)]",
    info: "text-[var(--canon-cyan)]",
    success: "text-[var(--canon-success)]",
    purple: "text-[var(--canon-magenta)]",
  };

  return (
    <aside className="canon-glass canon-ai-panel p-4">
      <p className="canon-section-title">{t("aiAssistantTitle")}</p>
      <p className="mt-1 text-sm text-[var(--canon-text-secondary)]">{t("aiPortfolioSubtitle")}</p>
      <ul className="mt-4 space-y-3">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex gap-3 text-sm">
              <Icon size={18} className={`shrink-0 ${toneClass[item.tone]}`} aria-hidden />
              <span className="text-[var(--canon-text-secondary)]">{item.title}</span>
            </li>
          );
        })}
      </ul>
      {projectCount > 0 ? (
        <p className="mt-3 text-xs text-[var(--canon-text-muted)]">
          {t("portfolioCountHint", { count: projectCount })}
        </p>
      ) : null}
      <Link href="/dashboard/ai" className="canon-ai-panel-btn mt-4">
        {t("openAiCenter")} →
      </Link>
    </aside>
  );
}
