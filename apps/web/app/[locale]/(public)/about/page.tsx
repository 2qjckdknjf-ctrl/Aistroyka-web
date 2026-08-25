import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41InnerPage } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.about" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.about");
  const tV41 = await getTranslations("public.v41");
  const sections = ["mission", "marketProblem", "whyAistroyka", "reliability"] as const;

  return (
    <V41InnerPage
      eyebrow={t("title")}
      title={t("title")}
      lead={t("metaDescription")}
      ctaLabel={tV41("launchPilot")}
      secondaryHref="/contact"
      secondaryLabel={tV41("contactUs")}
    >
      <div className="v41-inner-grid">
        {sections.map((key) => (
          <article key={key} className="v41-inner-card v41-glass">
            <h2>{t(key)}</h2>
            <p>{t(`${key}Desc`)}</p>
          </article>
        ))}
      </div>
    </V41InnerPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
