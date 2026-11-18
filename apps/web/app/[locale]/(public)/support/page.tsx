import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.support" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.support");
  const tNav = await getTranslations("public.nav");

  return (
    <SimpleMarketingPage
      title={t("title")}
      lead={t("body")}
      primaryLabel={tNav("contactUs")}
      primaryHref="/contact"
    />
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
