/**
 * Expert Review Queue observability — safe metadata only.
 */

import { logStructured } from "@/lib/observability";

export interface ExpertReviewAuditMeta {
  queueId: string;
  tenantId: string;
  taskType: string;
  audience: string;
  status: string;
  reviewerUserId?: string;
  verdict?: string;
  errorKind?: string;
}

export function logExpertReviewSubmission(meta: ExpertReviewAuditMeta): void {
  logStructured({
    event: "expert_review_queue_event",
    queue_id: meta.queueId,
    tenant_id: meta.tenantId,
    task_type: meta.taskType,
    audience: meta.audience,
    status: meta.status,
    reviewer_user_id: meta.reviewerUserId ?? null,
    verdict: meta.verdict ?? null,
    error_kind: meta.errorKind ?? null,
  });
}
