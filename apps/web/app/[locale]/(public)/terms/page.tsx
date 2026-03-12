import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.terms" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.terms");

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
          <strong>Placeholder — legal content.</strong> This page is intended for your final Terms of Service. Replace this block with your legal copy. Last updated: {new Date().toISOString().slice(0, 10)}.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">1. Acceptance</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          By using Aistroyka you agree to these terms and our Privacy Policy.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">2. Use of service</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          You must use the service in compliance with applicable law and not misuse or abuse the platform or other users.
        </p>
        <h2 className="mt-8 text-[var(--aistroyka-font-title3)] font-semibold">3. Contact</h2>
        <p className="text-[var(--aistroyka-text-secondary)]">
          For terms-related inquiries, use the Contact page.
        </p>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
