import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.pricing" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.pricing");

  const plans = [
    { key: "starter" as const, desc: "For small teams getting started." },
    { key: "business" as const, desc: "For growing teams and multiple projects." },
    { key: "enterprise" as const, desc: "For large organizations and custom needs." },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {plans.map(({ key, desc }) => (
          <div
            key={key}
            className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(key)}
            </h2>
            <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              {desc}
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/contact" className="btn-secondary text-sm">
                {t("requestQuote")}
              </Link>
              <Link href="/contact" className="btn-primary text-sm">
                {t("bookDemo")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
