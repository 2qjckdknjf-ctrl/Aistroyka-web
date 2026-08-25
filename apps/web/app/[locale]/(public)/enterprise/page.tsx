import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { V41InnerPage } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;
const READINESS = ["r1", "r2", "r3", "r4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.enterprise" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function EnterprisePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.enterprise");
  const tV41 = await getTranslations("public.v41");

  return (
    <V41InnerPage
      eyebrow={t("title")}
      title={t("heroTitle")}
      lead={t("metaDescription")}
      ctaLabel={t("ctaSales")}
      secondaryHref="/security"
      secondaryLabel={tV41("securityLink")}
    >
      <div className="v41-inner-grid cols-2">
        {SECTIONS.map((key) => (
          <article key={key} className="v41-inner-card v41-glass">
            <p>{t(key)}</p>
          </article>
        ))}
      </div>
      <div className="v41-inner-grid cols-2">
        {READINESS.map((key) => (
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
