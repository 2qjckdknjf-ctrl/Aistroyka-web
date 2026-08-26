import type { IssueStatus, UpdateIssueInput } from "./issue.types";

const CLOSED: IssueStatus[] = ["resolved", "closed"];

export function workerIssuePatchError(existing: { status: string }): string | null {
  if (CLOSED.includes(existing.status as IssueStatus)) return "Issue is closed";
  return null;
}

/** Empty incoming notes are omitted so a PATCH cannot wipe the defect text. */
export function nextWorkerIssueDescription(
  existing: string | null | undefined,
  incoming: string | undefined
): string | undefined {
  if (incoming === undefined) return undefined;
  const note = incoming.trim();
  if (!note) return undefined;
  const current = existing?.trim() ?? "";
  if (!current) return note;
  if (current === note || current.endsWith(`\n${note}`)) return current;
  return `${current}\n${note}`;
}

export function workerIssueUpdatePayload(
  input: UpdateIssueInput,
  description: string | undefined
): UpdateIssueInput {
  const out: UpdateIssueInput = {};
  if (description !== undefined) out.description = description;
  if (input.status !== undefined) out.status = input.status;
  if (input.evidence_upload_session_id !== undefined) {
    out.evidence_upload_session_id = input.evidence_upload_session_id;
  }
  return out;
}
