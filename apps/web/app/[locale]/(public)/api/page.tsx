import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const AVAILABLE = ["av1", "av2", "av3", "av4", "av5", "av6", "av7"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.api" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.api");

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("heroTitle")}
      primaryLabel={t("ctaAccess")}
      primaryHref="/contact"
      secondaryLabel={t("ctaEnterprise")}
      secondaryHref="/contact"
    >
      <section className="v41-page v41-section">
        <article className="v43-plan-card v41-glass">
          <p>{t("positioning")}</p>
        </article>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("availableTitle")}</h2>
        <ul className="v43-module-grid">
          {AVAILABLE.map((key) => (
            <li key={key} className="v43-plan-card v41-glass">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("dxTitle")}</h2>
        <ul className="v43-module-grid">
          <li className="v43-plan-card v41-glass">{t("dxAuth")}</li>
          <li className="v43-plan-card v41-glass">{t("dxRest")}</li>
          <li className="v43-plan-card v41-glass">{t("dxVersion")}</li>
          <li className="v43-plan-card v41-glass">{t("dxSandbox")}</li>
        </ul>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("examplesTitle")}</h2>
        <pre className="v43-plan-card v41-glass">{`GET /api/v1/projects
GET /api/v1/projects/{id}
POST /api/v1/tasks
GET /api/v1/reports?project_id=...`}</pre>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
