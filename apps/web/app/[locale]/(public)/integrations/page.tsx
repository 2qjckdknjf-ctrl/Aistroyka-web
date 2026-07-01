import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const CATEGORIES = [
  { key: "catErp" as const, status: "planned" as const },
  { key: "catBim" as const, status: "planned" as const },
  { key: "catDocs" as const, status: "planned" as const },
  { key: "catStorage" as const, status: "available" as const },
  { key: "catEmail" as const, status: "available" as const },
  { key: "catAnalytics" as const, status: "progress" as const },
  { key: "catMobile" as const, status: "available" as const },
  { key: "catApi" as const, status: "progress" as const },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.integrations" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.integrations");

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
          Integration categories
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ key, status }) => (
            <div
              key={key}
              className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4 shadow-[var(--aistroyka-shadow-e1)]"
            >
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">{t(key)}</div>
              <span className="mt-2 inline-block text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-tertiary)]">
                {t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}` as "statusPlanned" | "statusProgress" | "statusAvailable")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6">
        <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("archTitle")}
        </h2>
        <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("archBody")}
        </p>
      </section>

      <section className="mt-12 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-primary">{t("ctaEnterprise")}</Link>
        <Link href="/contact" className="btn-secondary">{t("ctaWorkflow")}</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
