import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const AVAILABLE = ["av1", "av2", "av3", "av4", "av5", "av6", "av7"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.api" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.api");

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <section className="text-center">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-[var(--aistroyka-text-secondary)]">{t("heroTitle")}</p>
        <p className="mt-4 rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-primary)] px-4 py-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
          {t("positioning")}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("availableTitle")}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {AVAILABLE.map((key) => (
            <li key={key} className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] px-4 py-3">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("dxTitle")}
        </h2>
        <ul className="mt-4 space-y-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          <li>{t("dxAuth")}</li>
          <li>{t("dxRest")}</li>
          <li>{t("dxVersion")}</li>
          <li>{t("dxSandbox")}</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
          Code examples (mock)
        </h2>
        <pre className="mt-3 overflow-x-auto rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-branded)] p-4 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-on-branded)]">
{`GET /api/v1/projects
GET /api/v1/projects/{id}
POST /api/v1/tasks
GET /api/v1/reports?project_id=...`}
        </pre>
      </section>

      <section className="mt-12 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-primary">{t("ctaAccess")}</Link>
        <Link href="/contact" className="btn-secondary">{t("ctaEnterprise")}</Link>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
