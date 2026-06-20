import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicGlassContentPage, PublicRevealGlassCard } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.terms" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.terms");

  return (
    <PublicGlassContentPage title={t("title")} description={t("metaDescription")}>
      <PublicRevealGlassCard>
        <div className="prose prose-neutral text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
          <p className="text-[var(--aistroyka-text-secondary)]">
            <strong>{t("placeholderStrong")}</strong> {t("placeholderBody")} {t("lastUpdated")}:{" "}
            {new Date().toISOString().slice(0, 10)}.
          </p>
          <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">{t("section1Title")}</h2>
          <p className="text-[var(--aistroyka-text-secondary)]">{t("section1Body")}</p>
          <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">{t("section2Title")}</h2>
          <p className="text-[var(--aistroyka-text-secondary)]">{t("section2Body")}</p>
          <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">{t("section3Title")}</h2>
          <p className="text-[var(--aistroyka-text-secondary)]">{t("section3Body")}</p>
        </div>
      </PublicRevealGlassCard>
    </PublicGlassContentPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
