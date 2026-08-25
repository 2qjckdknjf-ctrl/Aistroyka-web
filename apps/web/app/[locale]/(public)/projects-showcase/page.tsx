import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

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
    <SimpleMarketingPage title={t("title")} lead={t("metaDescription")}>
      <section className="v41-page v41-section v43-module-grid">
        {sections.map((key) => (
          <article key={key} className="v43-plan-card v41-glass">
            <p className="v41-eyebrow">{t("previewPlaceholder")}</p>
            <h2>{t(key)}</h2>
            <p>{t(`${key}Desc`)}</p>
          </article>
        ))}
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
