/**
 * Governed AI action executor — fail-closed policy enforcement with audit trail.
 * Does not perform prohibited writes; draft-only for consequential actions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AI_POLICY_VERSION, getPilotActionDefinition } from "./action-registry";
import type { AiActionExecutionRequest, AiActionExecutionResult } from "./action-registry.types";
import { assertAiActionNotProhibited } from "./prohibited-actions";
import { findByIdempotencyKey, insertAiActionAudit } from "./action-audit.repository";
import { evaluateReportCompleteness } from "@/lib/domain/reports/report-completeness.service";

const ALLOWED_TENANT_ROLES = new Set([
  "owner",
  "admin",
  "manager",
  "member",
  "worker",
  "stakeholder",
]);

async function assertProjectMembership(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data: member } = await supabase
    .from("project_members")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (member) return true;

  const { data: stakeholder } = await supabase
    .from("project_stakeholders")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  return Boolean(stakeholder);
}

function roleAllowed(defRoles: string[], userRole: string): boolean {
  return defRoles.includes(userRole);
}

async function executePilotActionBody(
  supabase: SupabaseClient,
  req: AiActionExecutionRequest
): Promise<{ draft?: Record<string, unknown>; warnings: string[] }> {
  const reportId = typeof req.input?.report_id === "string" ? req.input.report_id : null;

  switch (req.actionId) {
    case "validate_report_required_fields":
    case "validate_before_after_photos": {
      if (!reportId) return { warnings: ["report_id required"] };
      const evaluation = await evaluateReportCompleteness(supabase, req.tenantId, reportId);
      return {
        draft: { evaluation },
        warnings: evaluation.reasons,
      };
    }
    case "remind_missing_daily_report": {
      return {
        draft: {
          notification_type: "missing_daily_report",
          project_id: req.projectId,
          message: "Required daily report not submitted for today.",
        },
        warnings: [],
      };
    }
    case "draft_daily_summary":
    case "draft_weekly_summary": {
      return {
        draft: {
          summary_kind: req.actionId === "draft_daily_summary" ? "daily" : "weekly",
          project_id: req.projectId,
          body: "Draft summary placeholder — requires manager review before external use.",
          ai_generated: true,
          manager_review_required: true,
        },
        warnings: ["AI provider draft; manager approval required"],
      };
    }
    case "suggest_issue_category": {
      return {
        draft: {
          suggested_category: "quality",
          confidence: null,
          ai_generated: true,
        },
        warnings: ["Suggestion only; manager must confirm category"],
      };
    }
    case "suggest_responsible_manager": {
      return {
        draft: {
          suggested_manager_user_id: null,
          ai_generated: true,
        },
        warnings: ["Suggestion only; manager assignment requires human confirmation"],
      };
    }
    case "draft_owner_message": {
      return {
        draft: {
          audience: "owner",
          body: "Draft owner update — not sent until manager approval.",
          ai_generated: true,
          manager_approved: false,
        },
        warnings: ["Consequential external draft; manager approval required before send"],
      };
    }
    case "draft_followup_open_issue": {
      return {
        draft: {
          issue_id: req.input?.issue_id ?? null,
          followup_body: "Draft internal follow-up — not sent automatically.",
          ai_generated: true,
        },
        warnings: ["Internal draft only"],
      };
    }
    default:
      return { warnings: [`Unknown pilot action ${req.actionId}`] };
  }
}

export async function executeGovernedAiAction(
  supabase: SupabaseClient,
  req: AiActionExecutionRequest
): Promise<AiActionExecutionResult> {
  const prohibited = assertAiActionNotProhibited(req.actionId);
  if (!prohibited.ok) {
    const audit = await insertAiActionAudit(supabase, {
      tenant_id: req.tenantId,
      project_id: req.projectId,
      initiated_by: req.initiatedBy,
      action_id: req.actionId,
      policy_version: AI_POLICY_VERSION,
      outcome: "blocked",
      error_category: "prohibited_action",
      idempotency_key: req.idempotencyKey ?? null,
      details: { reason: prohibited.reason },
    });
    return {
      status: "blocked",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: "PROHIBITED",
      requiresHumanApproval: true,
      warnings: [prohibited.reason],
      errorCategory: "prohibited_action",
      auditRecordId: audit?.id,
    };
  }

  const def = getPilotActionDefinition(req.actionId);
  if (!def) {
    return {
      status: "blocked",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: "PROHIBITED",
      requiresHumanApproval: true,
      warnings: [`Unknown action ${req.actionId}`],
      errorCategory: "unknown_action",
    };
  }

  if (!ALLOWED_TENANT_ROLES.has(req.userRole) || !roleAllowed(def.requiredTenantRole, req.userRole)) {
    const audit = await insertAiActionAudit(supabase, {
      tenant_id: req.tenantId,
      project_id: req.projectId,
      initiated_by: req.initiatedBy,
      action_id: req.actionId,
      policy_version: AI_POLICY_VERSION,
      outcome: "blocked",
      error_category: "role_forbidden",
      idempotency_key: req.idempotencyKey ?? null,
    });
    return {
      status: "blocked",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: def.riskClass,
      requiresHumanApproval: def.requiresHumanApproval,
      warnings: [`Role ${req.userRole} not allowed for ${req.actionId}`],
      errorCategory: "role_forbidden",
      auditRecordId: audit?.id,
    };
  }

  const memberOk = await assertProjectMembership(supabase, req.tenantId, req.projectId, req.initiatedBy);
  if (!memberOk) {
    const audit = await insertAiActionAudit(supabase, {
      tenant_id: req.tenantId,
      project_id: req.projectId,
      initiated_by: req.initiatedBy,
      action_id: req.actionId,
      policy_version: AI_POLICY_VERSION,
      outcome: "blocked",
      error_category: "project_scope_forbidden",
      idempotency_key: req.idempotencyKey ?? null,
    });
    return {
      status: "blocked",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: def.riskClass,
      requiresHumanApproval: def.requiresHumanApproval,
      warnings: ["User not a member of project scope"],
      errorCategory: "project_scope_forbidden",
      auditRecordId: audit?.id,
    };
  }

  if (req.idempotencyKey) {
    const existing = await findByIdempotencyKey(supabase, req.tenantId, req.idempotencyKey);
    if (existing) {
      return {
        status: existing.dry_run ? "dry_run" : existing.outcome === "blocked" ? "blocked" : "executed",
        actionId: req.actionId,
        policyVersion: AI_POLICY_VERSION,
        riskClass: def.riskClass,
        requiresHumanApproval: def.requiresHumanApproval,
        warnings: ["Idempotent replay — no duplicate side effects"],
        auditRecordId: existing.id,
      };
    }
  }

  const dryRun = req.dryRun === true;
  const { draft, warnings } = await executePilotActionBody(supabase, req);

  const audit = await insertAiActionAudit(supabase, {
    tenant_id: req.tenantId,
    project_id: req.projectId,
    initiated_by: req.initiatedBy,
    action_id: req.actionId,
    policy_version: AI_POLICY_VERSION,
    source_refs: req.sourceRefs ?? [],
    dry_run: dryRun,
    outcome: dryRun ? "dry_run" : "success",
    idempotency_key: req.idempotencyKey ?? null,
    target_resource_type: typeof req.input?.report_id === "string" ? "report" : null,
    target_resource_id: typeof req.input?.report_id === "string" ? req.input.report_id : null,
    details: { draft_keys: draft ? Object.keys(draft) : [] },
  });

  if (dryRun) {
    return {
      status: "dry_run",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: def.riskClass,
      requiresHumanApproval: def.requiresHumanApproval,
      draft,
      warnings,
      auditRecordId: audit?.id,
    };
  }

  if (def.requiresHumanApproval) {
    return {
      status: "pending_approval",
      actionId: req.actionId,
      policyVersion: AI_POLICY_VERSION,
      riskClass: def.riskClass,
      requiresHumanApproval: true,
      draft,
      warnings,
      auditRecordId: audit?.id,
    };
  }

  return {
    status: def.riskClass === "DRAFT_ONLY" ? "draft_ready" : "executed",
    actionId: req.actionId,
    policyVersion: AI_POLICY_VERSION,
    riskClass: def.riskClass,
    requiresHumanApproval: def.requiresHumanApproval,
    draft,
    warnings,
    auditRecordId: audit?.id,
  };
}
