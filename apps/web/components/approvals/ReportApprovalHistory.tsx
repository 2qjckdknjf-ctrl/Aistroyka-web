"use client";

import { useQuery } from "@tanstack/react-query";

interface ApprovalEvent {
  action: string;
  user_id: string | null;
  created_at: string;
  details: Record<string, unknown>;
}

interface ApprovalHistoryData {
  report_id: string;
  events: ApprovalEvent[];
}

async function fetchApprovalHistory(reportId: string): Promise<ApprovalHistoryData> {
  const res = await fetch(`/api/v1/reports/${reportId}/approval-history`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load history");
  const json = await res.json();
  return json.data;
}

function eventLabel(action: string, details: Record<string, unknown>): string {
  if (action === "report_submit") return "Submitted for review";
  if (action === "report_review") {
    const status = details.status as string | undefined;
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    if (status === "changes_requested") return "Changes requested";
    return "Reviewed";
  }
  return action;
}

export function ReportApprovalHistory({ reportId }: { reportId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["report-approval-history", reportId],
    queryFn: () => fetchApprovalHistory(reportId),
    staleTime: 60 * 1000,
  });

  if (isPending || isError) return null;
  if (!data?.events?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-aistroyka-border">
      <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">
        Approval history
      </h3>
      <ul className="space-y-2 text-sm">
        {data.events.map((e, i) => (
          <li key={`${e.created_at}-${i}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
            <span className="text-aistroyka-text-tertiary tabular-nums">
              {new Date(e.created_at).toLocaleString()}
            </span>
            <span className="text-aistroyka-text-secondary">
              {eventLabel(e.action, e.details)}
              {e.user_id && (
                <span className="text-aistroyka-text-tertiary ml-1">
                  (user {e.user_id.slice(0, 8)}…)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
