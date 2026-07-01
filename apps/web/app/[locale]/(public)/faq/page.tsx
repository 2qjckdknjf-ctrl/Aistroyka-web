import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.faq" });
  return {
    title: `${t("title")} | Aistroyka`,
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <dl className="mt-12 space-y-6">
        {FAQ_ITEMS.map(({ q, a }) => (
          <div
            key={q}
            className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <dt className="text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(q)}
            </dt>
            <dd className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
              {t(a)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
