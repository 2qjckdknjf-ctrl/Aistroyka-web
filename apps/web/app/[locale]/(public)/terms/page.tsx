import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { LegalDocument } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.terms" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.terms");
  const tLegal = await getTranslations("public.v43.legal");

  return (
    <LegalDocument
      title={t("title")}
      updated={`${t("lastUpdated")}: ${tLegal("updatedOn")}`}
      intro={`${t("placeholderStrong")} ${t("placeholderBody")}`}
      progressLabel={tLegal("progress")}
      summaryTitle={tLegal("summary")}
      summaryItems={[tLegal("termsS1"), tLegal("termsS2"), tLegal("termsS3")]}
      nextLabel={tLegal("next")}
      sections={[
        { id: "general", title: tLegal("generalTitle"), body: [tLegal("generalBody")] },
        { id: "accept", title: t("section1Title"), body: [t("section1Body")] },
        { id: "use", title: t("section2Title"), body: [t("section2Body")] },
        { id: "store", title: tLegal("storeTitle"), body: [t("section3Body")] },
        { id: "rights", title: tLegal("rightsTitle"), body: [tLegal("termsRightsBody")] },
        { id: "contacts", title: tLegal("contactsTitle"), body: [tLegal("contactsBody")] },
      ]}
    />
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
