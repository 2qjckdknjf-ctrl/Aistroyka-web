import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.features" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.features");

  const features = [
    { key: "projectManagement" as const, desc: "Projects, structure, progress tracking." },
    { key: "tasks" as const, desc: "Assign, track, and complete tasks with deadlines." },
    { key: "dailyReports" as const, desc: "Daily reports from the field with evidence." },
    { key: "photoVideo" as const, desc: "Photo and video evidence linked to tasks." },
    { key: "aiAnalytics" as const, desc: "AI-powered analysis and risk detection." },
    { key: "teamRoles" as const, desc: "Roles, access control, and permissions." },
    { key: "dashboards" as const, desc: "Dashboards and operational metrics." },
    { key: "integrations" as const, desc: "API and integration readiness." },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {features.map(({ key, desc }) => (
          <div
            key={key}
            className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h2 className="text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(key)}
            </h2>
            <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
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
