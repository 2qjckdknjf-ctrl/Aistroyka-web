import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getSystemMetrics } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const supabase = await createClient();
  const allowed = await isAdmin(supabase);
  if (!allowed) {
    redirect("/dashboard");
  }

  const metrics = await getSystemMetrics(supabase);
  if (!metrics) {
    return (
      <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
        <Link href="/admin" className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent">
          ← Admin
        </Link>
        <div className="card">
          <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">System — Observability (PL1)</h1>
          <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-tertiary">Unable to load metrics.</p>
        </div>
      </main>
    );
  }

  const t = metrics.telemetry;
  const risk = metrics.riskDistribution;
  const usage = metrics.usage;

  return (
    <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
      <Link href="/admin" className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent">
        ← Admin
      </Link>
      <div className="card mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">System — Observability (PL1)</h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-tertiary">
          Read-only aggregates from existing DB. No new tables. Internal use only.
        </p>
      </div>

      <div className="space-y-aistroyka-8">
        <section>
          <h2 className="mb-aistroyka-4 text-aistroyka-headline font-semibold text-aistroyka-text-primary">AI Stability</h2>
          <div className="card">
            <dl className="grid gap-aistroyka-3 text-aistroyka-subheadline sm:grid-cols-2">
              <div><dt className="text-aistroyka-text-tertiary">analysis_success_rate</dt><dd className="font-medium text-aistroyka-text-primary">{t.analysis_success_rate.toFixed(1)}%</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">avg_analysis_duration</dt><dd className="font-medium text-aistroyka-text-primary">{t.avg_analysis_duration_seconds.toFixed(1)}s</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">retry_rate</dt><dd className="font-medium text-aistroyka-text-primary">{t.retry_rate.toFixed(1)}%</dd></div>
            </dl>
            <p className="mt-aistroyka-3 text-aistroyka-caption text-aistroyka-text-tertiary">Sample: {t._meta.totalJobs} jobs, {t._meta.completedJobs} completed.</p>
          </div>
        </section>
        <section>
          <h2 className="mb-aistroyka-4 text-aistroyka-headline font-semibold text-aistroyka-text-primary">Risk Distribution</h2>
          <div className="card">
            <dl className="grid gap-aistroyka-3 text-aistroyka-subheadline sm:grid-cols-3">
              <div><dt className="text-aistroyka-text-tertiary">low</dt><dd className="font-medium text-aistroyka-success">{risk.low}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">medium</dt><dd className="font-medium text-aistroyka-warning">{risk.medium}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">high</dt><dd className="font-medium text-aistroyka-error">{risk.high}</dd></div>
            </dl>
            <p className="mt-aistroyka-3 text-aistroyka-caption text-aistroyka-text-tertiary">From last {usage.totalAnalyses} analyses.</p>
          </div>
        </section>
        <section>
          <h2 className="mb-aistroyka-4 text-aistroyka-headline font-semibold text-aistroyka-text-primary">Usage Metrics</h2>
          <div className="card">
            <dl className="grid gap-aistroyka-3 text-aistroyka-subheadline sm:grid-cols-3">
              <div><dt className="text-aistroyka-text-tertiary">Total jobs (sample)</dt><dd className="font-medium text-aistroyka-text-primary">{usage.totalJobs}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">Total analyses (sample)</dt><dd className="font-medium text-aistroyka-text-primary">{usage.totalAnalyses}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">Total media</dt><dd className="font-medium text-aistroyka-text-primary">{usage.totalMedia}</dd></div>
            </dl>
          </div>
        </section>
        <section>
          <h2 className="mb-aistroyka-4 text-aistroyka-headline font-semibold text-aistroyka-text-primary">Drift Metrics</h2>
          <div className="card">
            <dl className="grid gap-aistroyka-3 text-aistroyka-subheadline sm:grid-cols-2">
              <div><dt className="text-aistroyka-text-tertiary">avg_confidence</dt><dd className="font-medium text-aistroyka-text-primary">{t.avg_confidence.toFixed(1)}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">anomaly_rate</dt><dd className="font-medium text-aistroyka-text-primary">{t.anomaly_rate.toFixed(1)}%</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">avg_strategic_risk</dt><dd className="font-medium text-aistroyka-text-primary">{t.avg_strategic_risk.toFixed(1)}</dd></div>
              <div><dt className="text-aistroyka-text-tertiary">avg_health_score</dt><dd className="font-medium text-aistroyka-text-primary">{t.avg_health_score.toFixed(1)}</dd></div>
            </dl>
            <p className="mt-aistroyka-3 text-aistroyka-caption text-aistroyka-text-tertiary">Confidence and health are proxies from risk_level and detected_issues (not stored governance).</p>
          </div>
        </section>
      </div>
    </main>
  );
}
