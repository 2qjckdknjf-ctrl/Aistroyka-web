import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41InnerPage } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

const TYPES = ["type1", "type2", "type3", "type4"] as const;
const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.partners" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.partners");
  const tV41 = await getTranslations("public.v41");

  return (
    <V41InnerPage
      eyebrow={t("title")}
      title={t("heroTitle")}
      lead={t("metaDescription")}
      ctaLabel={t("cta")}
      secondaryHref="/contact"
      secondaryLabel={tV41("contactUs")}
    >
      <div className="v41-inner-grid cols-2">
        {TYPES.map((key) => (
          <article key={key} className="v41-inner-card v41-glass">
            <p>{t(key)}</p>
          </article>
        ))}
      </div>
      <div className="v41-inner-grid cols-2">
        {BENEFITS.map((key) => (
          <article key={key} className="v41-inner-card v41-glass">
            <p>{t(key)}</p>
          </article>
        ))}
      </div>
    </V41InnerPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
