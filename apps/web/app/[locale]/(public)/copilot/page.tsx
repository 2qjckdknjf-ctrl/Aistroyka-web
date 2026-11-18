import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";
import { CopilotMockUI } from "./CopilotMockUI";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.copilot" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function CopilotPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.copilot");

  const caps = ["cap1", "cap2", "cap3", "cap4", "cap5", "cap6", "cap7"] as const;
  const patterns = ["pat1", "pat2", "pat3", "pat4", "pat5"] as const;

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("heroSubtitle")}
      primaryLabel={t("ctaDemo")}
      primaryHref="/contact"
      secondaryLabel={t("ctaPlatform")}
      secondaryHref="/platform"
    >
      <section className="v41-page v41-section">
        <h2>{t("capabilitiesTitle")}</h2>
        <ul className="v43-module-grid">
          {caps.map((key) => (
            <li key={key} className="v43-plan-card v41-glass">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("patternsTitle")}</h2>
        <ul className="v43-module-grid">
          {patterns.map((key) => (
            <li key={key} className="v43-plan-card v41-glass">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("mockAssistantUi")}</h2>
        <CopilotMockUI />
      </section>
      <section className="v41-page v41-section">
        <article className="v43-plan-card v41-glass">
          <h2>{t("humanTitle")}</h2>
          <p>{t("humanBody")}</p>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
