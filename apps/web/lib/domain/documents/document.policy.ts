import type { ProjectDocumentStatus } from "./document.types";

export type DocumentStatusTransition =
  | { ok: true }
  | { ok: false; reason: "invalid_status_transition" | "invalid_object_path_update" };

/**
 * Enforces explicit governance semantics for document review lifecycle.
 * This prevents UI/API from skipping governance (e.g. uploaded -> approved directly).
 */
export function validateDocumentStatusTransition(
  from: ProjectDocumentStatus,
  to: ProjectDocumentStatus
): DocumentStatusTransition {
  if (from === to) return { ok: true };

  // archived is terminal for status transitions
  if (from === "archived") {
    return { ok: false, reason: "invalid_status_transition" };
  }

  // draft -> uploaded | under_review | archived
  if (from === "draft") {
    if (to === "uploaded") return { ok: true };
    if (to === "under_review") return { ok: true };
    if (to === "archived") return { ok: true };
    return { ok: false, reason: "invalid_status_transition" };
  }

  // uploaded -> under_review (submit)
  if (from === "uploaded") {
    if (to === "under_review") return { ok: true };
    if (to === "archived") return { ok: true };
    return { ok: false, reason: "invalid_status_transition" };
  }

  // under_review -> approved | rejected | changes_requested | archived
  if (from === "under_review") {
    if (to === "approved" || to === "rejected" || to === "changes_requested")
      return { ok: true };
    if (to === "archived") return { ok: true };
    if (to === "under_review") return { ok: true };
    return { ok: false, reason: "invalid_status_transition" };
  }

  // changes_requested -> uploaded | under_review (manager resubmits)
  if (from === "changes_requested") {
    if (to === "uploaded" || to === "under_review") return { ok: true };
    if (to === "archived") return { ok: true };
    return { ok: false, reason: "invalid_status_transition" };
  }

  // approved/rejected -> archived only
  if (from === "approved" || from === "rejected") {
    if (to === "archived") return { ok: true };
    return { ok: false, reason: "invalid_status_transition" };
  }

  return { ok: false, reason: "invalid_status_transition" };
}

