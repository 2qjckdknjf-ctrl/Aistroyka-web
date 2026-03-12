import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.privacy" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.privacy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="prose prose-neutral mt-8 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
        <p className="text-[var(--aistroyka-text-secondary)]">
          <strong>Placeholder — legal content.</strong> This page is intended for your final Privacy Policy and data handling text. Replace this block with your legal copy. Last updated: {new Date().toISOString().slice(0, 10)}.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">1. Data we collect</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          We collect account data, usage data, and content you upload (e.g. project photos) to provide the service and improve our AI and product.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">2. How we use data</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          Data is used to operate the platform, provide AI analysis, support you, and improve our services in accordance with your agreement.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">3. Contact</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          For privacy inquiries, use the Contact page or your account contact.
        </p>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
