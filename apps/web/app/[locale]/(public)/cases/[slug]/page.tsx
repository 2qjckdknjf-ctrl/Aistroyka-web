import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

const CASE_SLUGS = ["residential", "commercial", "infrastructure", "renovation"] as const;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "public.cases" });
  if (!CASE_SLUGS.includes(slug as (typeof CASE_SLUGS)[number])) {
    return { title: t("title") };
  }
  const titleKey = slug as (typeof CASE_SLUGS)[number];
  return {
    title: t(titleKey),
    description: t("metaDescription"),
  };
}

export default async function CaseSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!CASE_SLUGS.includes(slug as (typeof CASE_SLUGS)[number])) notFound();
  const t = await getTranslations("public.cases");
  const key = slug as (typeof CASE_SLUGS)[number];

  return (
    <SimpleMarketingPage title={t(key)} lead={t("metaDescription")}>
      <section className="v41-page v41-section">
        <p>
          <Link href="/cases">{t("title")}</Link>
        </p>
        <article className="v43-plan-card v41-glass">
          <dl>
            <div>
              <dt>{t("projectSize")}</dt>
              <dd>{t(`${key}ProjectSize`)}</dd>
            </div>
            <div>
              <dt>{t("teamSize")}</dt>
              <dd>{t(`${key}TeamSize`)}</dd>
            </div>
            <div>
              <dt>{t("timeline")}</dt>
              <dd>{t(`${key}Timeline`)}</dd>
            </div>
            <div>
              <dt>{t("toolsUsed")}</dt>
              <dd>{t(`${key}ToolsUsed`)}</dd>
            </div>
            <div>
              <dt>{t("benefits")}</dt>
              <dd>{t(`${key}Benefits`)}</dd>
            </div>
          </dl>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of CASE_SLUGS) {
      params.push({ locale, slug });
    }
  }
  return params;
}
