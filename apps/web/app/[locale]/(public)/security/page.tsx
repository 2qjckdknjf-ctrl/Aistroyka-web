import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const SECTIONS = [
  { key: "dataProtection" as const, body: "Data is encrypted in transit and at rest. Access is role-based and auditable. We do not train models on your content." },
  { key: "aiSafety" as const, body: "AI outputs are recommendations; decisions remain with humans. No automated actions without review. Quotas and guardrails limit misuse." },
  { key: "infrastructureReliability" as const, body: "Platform runs on redundant, monitored infrastructure. Uptime targets and incident processes are in place for critical paths." },
  { key: "supabaseSecurity" as const, body: "Database and auth are powered by Supabase: row-level security, secure auth flows, and managed backups." },
  { key: "cloudflareProtection" as const, body: "Edge delivery and DDoS protection via Cloudflare. Security headers and best practices are applied globally." },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.security" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function SecurityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.security");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 space-y-8">
        {SECTIONS.map(({ key, body }) => (
          <div
            key={key}
            className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(key)}
            </h2>
            <p className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
