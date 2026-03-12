import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const TYPES = ["type1", "type2", "type3", "type4"] as const;
const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.partners" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.partners");

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <section className="text-center">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-[var(--aistroyka-text-secondary)]">{t("heroTitle")}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          Partner types
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TYPES.map((key) => (
            <div
              key={key}
              className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              {t(key)}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          Benefits
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((key) => (
            <div
              key={key}
              className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              {t(key)}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 flex justify-center">
        <Link href="/contact" className="btn-primary">{t("cta")}</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
