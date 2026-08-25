import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41InnerPage } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

const PLANS = [
  { key: "starter" as const, descKey: "starterDesc" as const },
  { key: "pro" as const, descKey: "proDesc" as const },
  { key: "business" as const, descKey: "businessDesc" as const },
  { key: "enterprise" as const, descKey: "enterpriseDesc" as const },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.pricing" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.pricing");
  const tV41 = await getTranslations("public.v41");

  return (
    <V41InnerPage
      eyebrow={t("title")}
      title={t("title")}
      lead={t("metaDescription")}
      ctaLabel={tV41("launchPilot")}
      secondaryHref="/contact"
      secondaryLabel={t("requestQuote")}
    >
      <div className="v41-inner-grid cols-2">
        {PLANS.map(({ key, descKey }) => (
          <article key={key} className="v41-inner-card v41-glass">
            <h2>{t(key)}</h2>
            <p>{t(descKey)}</p>
          </article>
        ))}
      </div>
    </V41InnerPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
