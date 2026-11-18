"use client";

import { useTranslations } from "next-intl";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Latest = { day: string; ai_trust_index: number; meta_stability_index: number; labels: Record<string, string> } | null;

export function TrustBanner({ latest }: { latest: Latest }) {
  const tDetail = useTranslations("dashboardDetail");
  if (!latest) {
    return (
      <DashboardGlassCard className="border-l-4 border-l-aistroyka-text-tertiary">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("noTrustDataYet")}
        </p>
      </DashboardGlassCard>
    );
  }
  const atiLabel = latest.labels?.ati_label ?? "medium";
  const msiLabel = latest.labels?.msi_label ?? "medium";
  const atiPct = Math.round(latest.ai_trust_index * 100);
  const oneLiner = atiLabel === "high" && msiLabel === "high" ? tDetail("aiTrustMetaStabilityHigh") : atiLabel === "low" || msiLabel === "low" ? tDetail("reviewGovernanceDataQuality") : tDetail("moderateTrustMonitorIndices");
  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent">
      <div className="flex flex-wrap items-center gap-aistroyka-6">
        <div>
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("aiTrustIndex")}</span>
          <p className="text-aistroyka-title3 font-bold text-aistroyka-text-primary">{atiPct}% ({atiLabel})</p>
        </div>
        <div>
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("metaStability")}</span>
          <p className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{msiLabel}</p>
        </div>
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{oneLiner}</p>
      </div>
      <p className="mt-aistroyka-2 text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("asOf")} {latest.day}</p>
    </DashboardGlassCard>
  );
}
