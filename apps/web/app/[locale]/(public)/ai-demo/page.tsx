import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { AiDemoSimulator } from "./AiDemoSimulator";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.aiDemo" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function AiDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.aiDemo");

  const capabilities = [
    "photoAnalysis",
    "progressTracking",
    "deviationDetection",
    "riskPrediction",
    "constructionInsights",
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <section className="text-center">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-[var(--aistroyka-text-secondary)]">
          {t("heroTitle")}
        </p>
        <Link href="#demo" className="btn-primary mt-6">
          {t("cta")}
        </Link>
      </section>

      <section id="demo" className="mt-16">
        <AiDemoSimulator />
      </section>

      <section className="mt-16">
        <h2 className="text-center text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("capabilitiesTitle")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((key) => (
            <div
              key={key}
              className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
            >
              <div className="font-semibold text-[var(--aistroyka-text-primary)]">{t(key)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
