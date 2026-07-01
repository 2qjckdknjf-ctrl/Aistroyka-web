import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const ITEMS = [
  { key: "webPlatform" as const, desc: "Full web app: dashboard, projects, tasks, reports, AI insights, team and settings." },
  { key: "managerApp" as const, desc: "Mobile app for managers: review reports, assign tasks, view AI insights on the go." },
  { key: "workerApp" as const, desc: "Light mobile app for field workers: daily reports, photo evidence, task completion." },
  { key: "aiEngine" as const, desc: "AI engine analyzes site photos for progress, deviations, and risks; outputs are human-reviewed." },
  { key: "integrations" as const, desc: "API and integration readiness for ERP, BIM, and other tools." },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.platform" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.platform");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 space-y-6">
        {ITEMS.map(({ key, desc }) => (
          <div
            key={key}
            className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(key)}
            </h2>
            <p className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
