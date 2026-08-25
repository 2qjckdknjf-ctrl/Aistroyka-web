import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const CATEGORIES = [
  { key: "catErp" as const, status: "planned" as const },
  { key: "catBim" as const, status: "planned" as const },
  { key: "catDocs" as const, status: "planned" as const },
  { key: "catStorage" as const, status: "available" as const },
  { key: "catEmail" as const, status: "available" as const },
  { key: "catAnalytics" as const, status: "progress" as const },
  { key: "catMobile" as const, status: "available" as const },
  { key: "catApi" as const, status: "progress" as const },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.integrations" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.integrations");

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("heroTitle")}
      primaryLabel={t("ctaEnterprise")}
      primaryHref="/contact"
      secondaryLabel={t("ctaWorkflow")}
      secondaryHref="/contact"
    >
      <section className="v41-page v41-section">
        <h2>{t("categoriesTitle")}</h2>
        <div className="v43-module-grid">
          {CATEGORIES.map(({ key, status }) => (
            <article key={key} className="v43-plan-card v41-glass">
              <h3>{t(key)}</h3>
              <p className="v41-eyebrow">
                {t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}` as "statusPlanned" | "statusProgress" | "statusAvailable")}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="v41-page v41-section">
        <article className="v43-plan-card v41-glass">
          <h2>{t("archTitle")}</h2>
          <p>{t("archBody")}</p>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
