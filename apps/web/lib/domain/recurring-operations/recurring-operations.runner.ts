/**
 * Cron-driven recurring operational checks (Wave 4 Step 17).
 * Service-role only; idempotent via recurring_automation_fire_events.dedupe_key.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { computeHandoverReadinessFromSummary } from "@/lib/domain/project-handover/handover-readiness";
import type { HandoverBlocker } from "@/lib/domain/project-handover/project-handover.types";
import * as notifRepo from "@/lib/domain/notifications/manager-notifications.repository";
import {
  computeNextDueAt,
  dedupePeriodKey,
} from "./recurring-operations.cadence";
import { humanRuleLabel, notificationTypeForKind } from "./recurring-operations.governance";
import {
  ensureDefaultRulesForTenant,
  fetchDueRules,
  insertFireEvent,
  updateRuleSchedule,
} from "./recurring-operations.repository";
import type { RecurringRuleKind } from "./recurring-operations.types";

const MAX_PROJECTS = 25;

function countBlocker(blockers: HandoverBlocker[], code: string): number {
  return blockers.find((b) => b.code === code)?.count ?? 0;
}

async function staleDiscussionManagerCount(
  admin: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count, error } = await admin
    .from("project_stakeholder_discussions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("status", "awaiting_manager")
    .lt("updated_at", cutoff);
  if (error) return 0;
  return count ?? 0;
}

async function aftercareOpenCount(
  admin: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<number> {
  const { count, error } = await admin
    .from("project_service_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .neq("status", "closed");
  if (error) return 0;
  return count ?? 0;
}

async function conditionMet(
  admin: SupabaseClient,
  tenantId: string,
  projectId: string,
  kind: RecurringRuleKind,
  summary: Awaited<ReturnType<typeof getProjectSummary>>
): Promise<{ met: boolean; detail: string }> {
  const handover = await computeHandoverReadinessFromSummary(admin, projectId, tenantId, summary);
  const blockers = handover.blockers;
  const blockingDefects = countBlocker(blockers, "blocking_punch_defects");

  switch (kind) {
    case "handover_blocked_followup": {
      const met = !handover.ready && blockers.length > 0;
      return { met, detail: met ? `${blockers.length} readiness issue(s) remain.` : "" };
    }
    case "blocking_defects_followup": {
      const met = blockingDefects > 0;
      return { met, detail: met ? `${blockingDefects} blocking defect(s).` : "" };
    }
    case "stale_discussion_manager": {
      const n = await staleDiscussionManagerCount(admin, tenantId, projectId);
      return { met: n > 0, detail: n > 0 ? `${n} discussion(s) stale (7+ days awaiting manager).` : "" };
    }
    case "aftercare_open_review": {
      const n = await aftercareOpenCount(admin, tenantId, projectId);
      return { met: n > 0, detail: n > 0 ? `${n} open service request(s).` : "" };
    }
    default:
      return { met: false, detail: "" };
  }
}

export async function runRecurringOperationalAutomation(admin: SupabaseClient): Promise<{
  tenantsProcessed: number;
  rulesRun: number;
  fires: number;
  notifications: number;
}> {
  const nowIso = new Date().toISOString();
  const { data: tenants, error: te } = await admin.from("tenants").select("id");
  if (te || !tenants?.length) {
    return { tenantsProcessed: 0, rulesRun: 0, fires: 0, notifications: 0 };
  }

  for (const t of tenants as { id: string }[]) {
    await ensureDefaultRulesForTenant(admin, t.id);
  }

  const dueRules = await fetchDueRules(admin, nowIso);
  let fires = 0;
  let notifications = 0;
  let rulesRun = 0;

  for (const rule of dueRules) {
    const kind = rule.rule_kind as RecurringRuleKind;
    const period = dedupePeriodKey(rule.cadence, rule.cadence_days);
    const projects = (await projectRepo.listByTenant(admin, rule.tenant_id)).slice(0, MAX_PROJECTS);

    for (const p of projects) {
      const summary = await getProjectSummary(admin, p.id, rule.tenant_id);
      const { met, detail } = await conditionMet(admin, rule.tenant_id, p.id, kind, summary);
      if (!met) continue;

      const dedupe_key = `${rule.tenant_id}:${kind}:${p.id}:${period}`;
      const title = `Recurring: ${humanRuleLabel(kind)} — ${p.name}`;
      const body = detail || `Scheduled operational check (${rule.cadence}).`;

      const inserted = await insertFireEvent(admin, {
        tenant_id: rule.tenant_id,
        rule_id: rule.id,
        project_id: p.id,
        rule_kind: kind,
        dedupe_key,
        payload: { project_name: p.name, detail },
      });
      if (!inserted) continue;
      fires++;

      await notifRepo.notifyProjectManagers(admin, rule.tenant_id, p.id, {
        type: notificationTypeForKind(kind),
        title,
        body,
        target_type: "project",
        target_id: p.id,
        project_id: p.id,
      });
      notifications++;
    }

    rulesRun++;
    const nextDue = computeNextDueAt(rule.cadence, rule.cadence_days, new Date());
    await updateRuleSchedule(admin, rule.id, nowIso, nextDue);
  }

  return {
    tenantsProcessed: tenants.length,
    rulesRun,
    fires,
    notifications,
  };
}
