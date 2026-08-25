import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const CASE_SLUGS = ["residential", "commercial", "infrastructure", "renovation"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.cases" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function CasesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.cases");

  return (
    <SimpleMarketingPage title={t("title")} lead={t("metaDescription")}>
      <section className="v41-page v41-section v43-module-grid">
        {CASE_SLUGS.map((slug) => {
          const titleKey = slug as "residential" | "commercial" | "infrastructure" | "renovation";
          return (
            <Link key={slug} href={`/cases/${slug}`} className="v43-plan-card v41-glass">
              <h2>{t(titleKey)}</h2>
              <dl>
                <div>
                  <dt>{t("projectSize")}</dt>
                  <dd>{t(`${slug}ProjectSize`)}</dd>
                </div>
                <div>
                  <dt>{t("teamSize")}</dt>
                  <dd>{t(`${slug}TeamSize`)}</dd>
                </div>
                <div>
                  <dt>{t("timeline")}</dt>
                  <dd>{t(`${slug}Timeline`)}</dd>
                </div>
              </dl>
              <p>{t(`${slug}Benefits`)}</p>
            </Link>
          );
        })}
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
