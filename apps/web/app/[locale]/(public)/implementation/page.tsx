import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const PHASES = ["phase1", "phase2", "phase3", "phase4", "phase5", "phase6"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.implementation" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function ImplementationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.implementation");

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("heroTitle")}
      primaryLabel={t("ctaPlan")}
      primaryHref="/contact"
      secondaryLabel={t("ctaConsult")}
      secondaryHref="/contact"
    >
      <section className="v41-page v41-section">
        <h2>{t("phasesTitle")}</h2>
        <ol className="v43-module-grid">
          {PHASES.map((key, i) => (
            <li key={key} className="v43-plan-card v41-glass">
              <p className="v41-eyebrow">{i + 1}</p>
              <h3>{t(key)}</h3>
            </li>
          ))}
        </ol>
      </section>
      <section className="v41-page v41-section">
        <article className="v43-plan-card v41-glass">
          <p>{t("explainDuration")}</p>
          <p>{t("explainNeeds")}</p>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
