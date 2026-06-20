import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicGlassContentPage, PublicRevealGlassCard } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.projectsShowcase" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function ProjectsShowcasePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.projectsShowcase");

  const sections = ["dashboard", "aiAnalytics", "progressTracking", "mobileReporting"] as const;

  return (
    <PublicGlassContentPage title={t("title")} description={t("metaDescription")} maxWidthClass="max-w-5xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((key) => (
          <PublicRevealGlassCard key={key} interactive>
            <div className="mb-4 flex h-32 items-center justify-center rounded-[var(--aistroyka-radius-lg)] bg-aistroyka-bg-primary/80 text-aistroyka-text-tertiary">
              {t("previewPlaceholder")}
            </div>
            <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">{t(key)}</h2>
            <p className="mt-2 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">{t(`${key}Desc`)}</p>
          </PublicRevealGlassCard>
        ))}
      </div>
    </PublicGlassContentPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
