import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

const EXAMPLES = ["ex1", "ex2", "ex3", "ex4", "ex5"] as const;
const BENEFITS = ["b1", "b2", "b3", "b4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.workflows" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function WorkflowsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.workflows");
  const tV41 = await getTranslations("public.v41");

  return (
    <SimpleMarketingPage title={t("title")} lead={t("heroTitle")} primaryLabel={tV41("launchPilot")}>
      <section className="v41-page v41-section">
        <h2>{t("examplesTitle")}</h2>
        <div className="v43-module-grid">
          {EXAMPLES.map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <p>{t(key)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v41-page v41-section">
        <h2>{t("benefitsTitle")}</h2>
        <div className="v43-module-grid">
          {BENEFITS.map((key) => (
            <article key={key} className="v43-plan-card v41-glass">
              <p>{t(key)}</p>
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
