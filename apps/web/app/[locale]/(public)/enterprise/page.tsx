import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;
const READINESS = ["r1", "r2", "r3", "r4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.enterprise" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function EnterprisePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.enterprise");

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
          Enterprise capabilities
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((key) => (
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
          Enterprise readiness
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {READINESS.map((key) => (
            <div
              key={key}
              className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              {t(key)}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-primary">{t("ctaSales")}</Link>
        <Link href="/contact" className="btn-secondary">{t("ctaDemo")}</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
