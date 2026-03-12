import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { CopilotMockUI } from "./CopilotMockUI";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.copilot" });
  return { title: `${t("title")} | Aistroyka`, description: t("metaDescription") };
}

export default async function CopilotPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.copilot");

  const caps = ["cap1", "cap2", "cap3", "cap4", "cap5", "cap6", "cap7"] as const;
  const patterns = ["pat1", "pat2", "pat3", "pat4", "pat5"] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <section className="text-center">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-[var(--aistroyka-text-secondary)]">{t("heroTitle")}</p>
        <p className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("heroSubtitle")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/contact" className="btn-primary">{t("ctaDemo")}</Link>
          <Link href="/platform" className="btn-secondary">{t("ctaPlatform")}</Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("capabilitiesTitle")}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {caps.map((key) => (
            <li key={key} className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("patternsTitle")}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {patterns.map((key) => (
            <li key={key} className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4">
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
          Mock assistant UI
        </h2>
        <div className="mt-4">
          <CopilotMockUI />
        </div>
      </section>

      <section className="mt-16 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6">
        <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("humanTitle")}
        </h2>
        <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("humanBody")}
        </p>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
