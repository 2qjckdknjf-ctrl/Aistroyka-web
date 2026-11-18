import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { FaqAccordion, SimpleMarketingPage } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.faq" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

const FAQ_ITEMS = [
  { q: "whatIs", a: "whatIsA" },
  { q: "whoIsFor", a: "whoIsForA" },
  { q: "howAi", a: "howAiA" },
  { q: "mobile", a: "mobileA" },
  { q: "pricing", a: "pricingA" },
] as const;

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.faq");

  return (
    <SimpleMarketingPage title={t("title")} lead={t("metaDescription")}>
      <FaqAccordion items={FAQ_ITEMS.map(({ q, a }) => ({ q: t(q), a: t(a) }))} />
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
