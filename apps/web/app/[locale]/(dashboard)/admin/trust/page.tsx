import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionHeader, EmptyState } from "@/components/ui";
import { TrustBanner } from "./TrustBanner";
import { IndicesCards } from "./IndicesCards";
import { CausalHints } from "./CausalHints";
import { TrustTimeline } from "./TrustTimeline";
import { TrustActions } from "./TrustActions";

export const dynamic = "force-dynamic";

type TrustDailyRow = {
  day: string;
  trust_version: string;
  governance_risk_index: number;
  ai_trust_index: number;
  meta_stability_index: number;
  labels: Record<string, string>;
  reasons: Record<string, string[]>;
  causal_hints: Array<{ hint_type: string; severity: string; confidence: number; summary: string; evidence: Record<string, unknown> }>;
};

export default async function TrustDashboardPage() {
  const supabase = await createClient();

  const [latestRes, timelineRes, hintsRes] = await Promise.all([
    supabase
      .from("ai_trust_daily")
      .select("day, trust_version, governance_risk_index, ai_trust_index, meta_stability_index, labels, reasons, causal_hints")
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_trust_daily")
      .select("day, ai_trust_index, governance_risk_index, meta_stability_index")
      .order("day", { ascending: true })
      .limit(90),
    supabase
      .from("ai_causal_hints")
      .select("id, day, hint_type, severity, confidence, summary, evidence")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const latest = latestRes.data as TrustDailyRow | null;
  const timeline = (timelineRes.data ?? []) as Array<{ day: string; ai_trust_index: number; governance_risk_index: number; meta_stability_index: number }>;
  const hints = (hintsRes.data ?? []) as Array<{ id: string; day: string; hint_type: string; severity: string; confidence: number; summary: string | null; evidence: Record<string, unknown> }>;

  return (
    <main
      id="ai_trust_dashboard"
      className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8"
      aria-label="AI Trust Dashboard"
    >
      <Link
        href="/admin"
        className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        ← Admin
      </Link>
      <div className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent pl-aistroyka-4">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Doverie k AI
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          AI Trust Index, Meta-Stability, Governance Risk, and causal hints. No PII.
        </p>
      </div>

      <section id="ai_trust_banner" className="mb-aistroyka-8" aria-labelledby="trust-banner-heading">
        <TrustBanner latest={latest} />
      </section>

      <section className="mb-aistroyka-8">
        <SectionHeader title="Indices" />
        <IndicesCards latest={latest} />
      </section>

      <section id="ai_causal_hints" className="mb-aistroyka-8" aria-labelledby="causal-hints-heading">
        <h2 id="causal-hints-heading" className="mb-aistroyka-2 text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">
          Causal Hints
        </h2>
        <CausalHints hints={latest?.causal_hints ?? hints.slice(0, 5)} />
      </section>

      <section className="mb-aistroyka-8">
        <SectionHeader title="Trust Timeline (30/90 days)" />
        <TrustTimeline timeline={timeline} />
      </section>

      <section className="mb-aistroyka-8">
        <TrustActions />
      </section>
    </main>
  );
}
