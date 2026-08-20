import { getTranslations } from "next-intl/server";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

const MEDIA_ORDER = ["before", "after", "progress", "issue", "document", "other"] as const;
type MediaBucket = (typeof MEDIA_ORDER)[number];

function normalizeMediaCategory(raw: string): MediaBucket {
  const c = raw.toLowerCase();
  if (MEDIA_ORDER.includes(c as MediaBucket)) return c as MediaBucket;
  return "other";
}

function translateProofShareEnum(
  raw: string,
  prefix: "documentStatus" | "requestStatus" | "commercialStatus",
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const key = `${prefix}_${raw}`;
  const label = t(key);
  const missing = label === key || label === `proofShare.${key}`;
  if (missing) return raw.replace(/_/g, " ");
  return label;
}

async function getProofPack(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const res = await fetch(`${base}/api/v1/share/proof/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as {
    project: { name: string };
    progress: { tasks_done: number; tasks_total: number };
    media: { id: string; category: string; file_url: string; uploaded_at: string | null }[];
    documents: { id: string; title: string; type: string; status: string }[];
    decisions: { id: string; title: string; status: string }[];
    approved_commercial_changes: { id: string; title: string; amount: number; currency: string; status: string }[];
  };
}

export default async function ProofSharePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "proofShare" });
  const pack = await getProofPack(token);

  if (!pack) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <DashboardGlassCard className="p-6">
          <h1 className="text-aistroyka-title3 font-semibold">{t("unavailableTitle")}</h1>
          <p className="mt-2 text-aistroyka-text-secondary">{t("unavailableHint")}</p>
        </DashboardGlassCard>
      </main>
    );
  }

  const byCategory = new Map<MediaBucket, typeof pack.media>();
  for (const key of MEDIA_ORDER) byCategory.set(key, []);
  for (const item of pack.media) {
    const bucket = normalizeMediaCategory(item.category);
    byCategory.get(bucket)!.push(item);
  }

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `${amount.toLocaleString(locale)} ${currency}`;
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent p-4 sm:p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{t("subtitle")}</p>
        <h1 className="mt-1 text-aistroyka-title font-bold text-aistroyka-text-primary">{pack.project.name}</h1>
        <p className="mt-2 text-sm text-aistroyka-text-secondary sm:text-base">
          {t("progressLine", { done: pack.progress.tasks_done, total: pack.progress.tasks_total })}
        </p>
      </DashboardGlassCard>

      <DashboardGlassCard className="p-4 sm:p-6">
        <h2 className="text-aistroyka-title3 font-semibold">{t("evidenceHeading")}</h2>
        {pack.media.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("evidenceEmpty")}</p>
        ) : (
          <div className="mt-4 space-y-8">
            {MEDIA_ORDER.map((bucket) => {
              const items = byCategory.get(bucket)!;
              if (items.length === 0) return null;
              return (
                <section key={bucket} aria-label={t(`mediaSection.${bucket}`)}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
                    {t(`mediaSection.${bucket}`)}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <figure
                        key={item.id}
                        className="overflow-hidden rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/20"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.file_url}
                          alt=""
                          className="aspect-[4/3] w-full object-cover sm:h-44 sm:aspect-auto"
                        />
                        <figcaption className="p-2 text-xs text-aistroyka-text-tertiary">
                          {item.uploaded_at
                            ? new Date(item.uploaded_at).toLocaleDateString(locale, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </DashboardGlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardGlassCard className="p-4">
          <h2 className="font-semibold">{t("documentsHeading")}</h2>
          {pack.documents.length === 0 ? (
            <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("emptyList")}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {pack.documents.map((doc) => (
                <li key={doc.id}>
                  {doc.title} · {translateProofShareEnum(doc.status, "documentStatus", t)}
                </li>
              ))}
            </ul>
          )}
        </DashboardGlassCard>
        <DashboardGlassCard className="p-4">
          <h2 className="font-semibold">{t("decisionsHeading")}</h2>
          {pack.decisions.length === 0 ? (
            <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("emptyList")}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {pack.decisions.map((decision) => (
                <li key={decision.id}>
                  {decision.title} · {translateProofShareEnum(decision.status, "requestStatus", t)}
                </li>
              ))}
            </ul>
          )}
        </DashboardGlassCard>
        <DashboardGlassCard className="p-4">
          <h2 className="font-semibold">{t("commercialHeading")}</h2>
          {pack.approved_commercial_changes.length === 0 ? (
            <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("emptyList")}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {pack.approved_commercial_changes.map((item) => (
                <li key={item.id}>
                  {item.title}: {formatAmount(item.amount, item.currency)} ·{" "}
                  {translateProofShareEnum(item.status, "commercialStatus", t)}
                </li>
              ))}
            </ul>
          )}
        </DashboardGlassCard>
      </div>
    </main>
  );
}
