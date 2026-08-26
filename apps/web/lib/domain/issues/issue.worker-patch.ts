import type { IssueStatus } from "./issue.types";

const WORKER_ISSUE_STATUSES: IssueStatus[] = ["open", "in_review"];

export function isWorkerAllowedIssueStatus(status: string): status is IssueStatus {
  return WORKER_ISSUE_STATUSES.includes(status as IssueStatus);
}

/** Resolved/closed issues stay manager-owned. Workers must not reopen them. */
export function workerMayMutateIssue(status: IssueStatus): boolean {
  return status !== "resolved" && status !== "closed";
}

/**
 * Workers may add a resolution note; they must not wipe or replace the original
 * defect description. Empty incoming values are ignored. Matching or suffix
 * notes (idempotent retries / client echo of the current text) are no-ops.
 */
export function nextWorkerIssueDescription(
  existing: string | null | undefined,
  incoming: string | undefined
): string | undefined {
  if (incoming === undefined) return undefined;
  const note = incoming.trim();
  if (!note) return undefined;
  const current = existing?.trim() ?? "";
  if (!current) return note;
  if (current === note || current.endsWith(note)) return undefined;
  return `${current}\n\n${note}`;
}
