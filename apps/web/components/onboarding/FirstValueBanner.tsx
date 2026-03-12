"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";

async function fetchStatus(): Promise<{ reportCount: number; projectCount: number; firstProjectId?: string }> {
  const res = await fetch("/api/activation/status", { credentials: "include" });
  if (!res.ok) return { reportCount: 0, projectCount: 0 };
  const json = await res.json();
  return {
    reportCount: json.reportCount ?? 0,
    projectCount: json.projectCount ?? 0,
    firstProjectId: json.firstProjectId,
  };
}

/**
 * Shows after first report: prompt to view AI analysis (Project health, Top risks, Recommendations).
 */
export function FirstValueBanner() {
  const { data } = useQuery({
    queryKey: ["activation-status"],
    queryFn: fetchStatus,
    staleTime: 30 * 1000,
  });

  if (!data || data.reportCount < 1 || data.projectCount < 1) return null;

  const projectId = data.firstProjectId;
  const href = projectId ? `/projects/${projectId}/ai` : "/dashboard/projects";

  return (
    <div className="mb-6 rounded-[var(--aistroyka-radius-card)] border border-aistroyka-accent/30 bg-aistroyka-accent-light/30 px-4 py-3">
      <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
        First report submitted. View AI analysis: Project health, Top risks, Recommendations.
      </p>
      <Link href={href} className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline">
        Open AI insights →
      </Link>
    </div>
  );
}
