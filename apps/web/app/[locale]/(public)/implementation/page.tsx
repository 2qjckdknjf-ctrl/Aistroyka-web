import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const PHASES = ["phase1", "phase2", "phase3", "phase4", "phase5", "phase6"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.implementation" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function ImplementationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.implementation");

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
          Phases
        </h2>
        <ol className="mt-6 space-y-4">
          {PHASES.map((key, i) => (
            <li
              key={key}
              className="flex gap-4 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--aistroyka-accent)] text-[var(--aistroyka-font-footnote)] font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                {t(key)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6">
        <p className="text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("explainDuration")}
        </p>
        <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("explainNeeds")}
        </p>
      </section>

      <section className="mt-12 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-primary">{t("ctaPlan")}</Link>
        <Link href="/contact" className="btn-secondary">{t("ctaConsult")}</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
