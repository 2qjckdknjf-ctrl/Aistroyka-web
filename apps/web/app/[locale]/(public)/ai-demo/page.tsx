import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";
import { AiDemoSimulator } from "./AiDemoSimulator";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.aiDemo" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function AiDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.aiDemo");

  const capabilities = [
    "photoAnalysis",
    "progressTracking",
    "deviationDetection",
    "riskPrediction",
    "constructionInsights",
  ] as const;

  return (
    <SimpleMarketingPage title={t("title")} lead={t("heroTitle")} primaryLabel={t("cta")} primaryHref="#demo">
      <section id="demo" className="v41-page v41-section">
        <AiDemoSimulator />
      </section>
      <section className="v41-page v41-section">
        <h2>{t("capabilitiesTitle")}</h2>
        <div className="v43-module-grid">
          {capabilities.map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <h3>{t(key)}</h3>
            </article>
          ))}
        </div>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
