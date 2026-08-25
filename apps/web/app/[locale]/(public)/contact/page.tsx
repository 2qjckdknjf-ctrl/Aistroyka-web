import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { ContactForm } from "./ContactForm";
import { V41InnerPage } from "@/components/public/v41";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.contact" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.contact");
  const tV41 = await getTranslations("public.v41");

  return (
    <V41InnerPage eyebrow={t("title")} title={t("title")} lead={t("metaDescription")} ctaLabel={tV41("launchPilot")}>
      <article className="v41-inner-card v41-glass">
        <h2>{t("formTitle")}</h2>
        <div className="mt-4">
          <ContactForm />
        </div>
      </article>
      <article className="v41-inner-card v41-glass">
        <h2>{t("demoBlockTitle")}</h2>
        <p>{t("businessCtaDetails")}</p>
      </article>
    </V41InnerPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
