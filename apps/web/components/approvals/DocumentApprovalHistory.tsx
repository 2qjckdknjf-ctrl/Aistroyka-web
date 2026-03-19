"use client";

import { useQuery } from "@tanstack/react-query";

interface ApprovalEvent {
  action: string;
  user_id: string | null;
  created_at: string;
  details: Record<string, unknown>;
}

interface ApprovalHistoryData {
  project_id: string;
  document_id: string;
  events: ApprovalEvent[];
}

async function fetchApprovalHistory(projectId: string, documentId: string): Promise<ApprovalHistoryData> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}/approval-history`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load approval history");
  const json = await res.json();
  return json.data;
}

function eventLabel(action: string, details: Record<string, unknown>): string {
  if (action === "document_upload") return "Uploaded";
  if (action === "document_submit_for_review") return "Submitted for review";
  if (action === "document_review") {
    const to = typeof details.to === "string" ? details.to : null;
    if (to === "approved") return "Approved";
    if (to === "rejected") return "Rejected";
    return "Reviewed";
  }
  if (action === "document_archive") return "Archived";
  return action;
}

export function DocumentApprovalHistory({
  projectId,
  documentId,
}: {
  projectId: string;
  documentId: string;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["document-approval-history", projectId, documentId],
    queryFn: () => fetchApprovalHistory(projectId, documentId),
    staleTime: 60 * 1000,
  });

  if (isPending || isError || !data) return null;

  return (
    <div className="pt-1">
      <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">
        Approval history
      </h3>
      {data.events.length === 0 ? (
        <p className="text-aistroyka-text-tertiary text-sm">
          No governance events recorded for this document yet.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.events.map((e, i) => (
            <li key={`${e.created_at}-${i}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span className="text-aistroyka-text-tertiary tabular-nums">
                {new Date(e.created_at).toLocaleString()}
              </span>
              <span className="text-aistroyka-text-secondary">
                {eventLabel(e.action, e.details)}
                {e.user_id && (
                  <span className="text-aistroyka-text-tertiary ml-1">(user {e.user_id.slice(0, 8)}…)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

