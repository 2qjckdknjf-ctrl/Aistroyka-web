import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const EXAMPLES = ["ex1", "ex2", "ex3", "ex4", "ex5"] as const;
const BENEFITS = ["b1", "b2", "b3", "b4"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.workflows" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function WorkflowsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.workflows");

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
          Workflow examples
        </h2>
        <div className="mt-6 space-y-4">
          {EXAMPLES.map((key) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--aistroyka-accent-light)] text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-accent)]">
                →
              </span>
              <span className="text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                {t(key)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("benefitsTitle")}
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
        <Link href="/contact" className="btn-primary">Request demo</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
