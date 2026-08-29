/**
 * Slice 01 read-only skills. Wrap existing domain / AI Brain services.
 * Bounded queries — never dump full project rows into the model.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AgentError } from "../errors";
import { toAgentEvidence } from "../contracts/evidence.types";
import type { AgentExecutionContext } from "../types";
import { assembleProjectTruthSnapshot } from "@/lib/ai-brain/phase-a";
import { getProjectHealthScore } from "@/lib/ai-brain/services/project-health-v2.service";
import { getTopRiskInsights } from "@/lib/ai-brain/services/top-risks.service";
import { getMissingEvidenceInsights } from "@/lib/ai-brain/services/missing-evidence.service";
import { listReportsForManager } from "@/lib/domain/reports/report-list.repository";
import { scoreToBand, type ProjectHealthV1 } from "../health/project-health";
import { findProjectBlockers, type ProjectBlocker } from "../blockers/find-blockers";
import { EmptySkillInputSchema, type AgentSkill, type SkillDefinition, type SkillResult } from "./skill.types";
import { assertQueryOk } from "./query";

const SKILL_LIMIT = 20;

function baseDef(
  name: string,
  description: string,
  extra?: Partial<SkillDefinition>
): SkillDefinition {
  return {
    id: name,
    name,
    version: "1",
    description,
    riskLevel: "LOW",
    executionMode: "READ",
    requiredPermissions: ["project:read"],
    inputSchema: EmptySkillInputSchema,
    outputSchema: z.unknown(),
    requiresProject: true,
    requiresEvidence: false,
    requiresApproval: false,
    handler: name,
    ...extra,
  };
}

function authorizeProject(context: AgentExecutionContext): Promise<void> {
  if (!context.tenantId || !context.projectId) {
    return Promise.reject(new AgentError("AGENT_PROJECT_ACCESS_DENIED", "missing_scope", 403));
  }
  return Promise.resolve();
}

function readSkill(
  definition: SkillDefinition,
  execute: (context: AgentExecutionContext) => Promise<SkillResult>
): AgentSkill<Record<string, never>> {
  return {
    definition,
    validateInput(input: unknown) {
      return EmptySkillInputSchema.parse(input ?? {}) as Record<string, never>;
    },
    authorize: authorizeProject,
    execute: (context) => execute(context),
  };
}

export function createReadSkills(supabase: SupabaseClient): AgentSkill[] {
  return [
    readSkill(baseDef("get_project_state", "Unified project state summary"), async (ctx) => {
      const snapshot = await assembleProjectTruthSnapshot(supabase, ctx.projectId, ctx.tenantId);
      if (!snapshot) {
        return {
          output: { projectId: ctx.projectId, status: "unknown" },
          evidence: [],
          insufficientEvidence: true,
        };
      }
      return {
        output: {
          projectId: snapshot.projectId,
          status: snapshot.projectStatus,
          taskSummary: {
            total: snapshot.openTaskCounts.total,
            open: snapshot.openTaskCounts.total - snapshot.openTaskCounts.completed,
            overdue: snapshot.openTaskCounts.overdue,
            inProgress: snapshot.openTaskCounts.inProgress,
          },
          reportFreshness: snapshot.reportFreshness,
          milestoneCount: snapshot.milestoneSummary.count,
          lastActivityAt: snapshot.lastActivityAt,
        },
        evidence: [
          toAgentEvidence({
            type: "DATABASE_STATE",
            sourceEntityType: "projects",
            sourceEntityId: ctx.projectId,
            capturedAt: snapshot.at,
          }),
        ],
        insufficientEvidence: snapshot.dataSufficiencyFlags.snapshot === "missing",
      };
    }),

    readSkill(baseDef("get_project_summary", "Compact project summary for LLM context"), async (ctx) => {
      const snapshot = await assembleProjectTruthSnapshot(supabase, ctx.projectId, ctx.tenantId);
      return {
        output: snapshot
          ? {
              projectId: snapshot.projectId,
              status: snapshot.projectStatus,
              tasks: snapshot.openTaskCounts,
              risks: snapshot.topRisksSummary,
              missingEvidence: snapshot.missingEvidenceSummary,
              warnings: snapshot.snapshotWarnings.slice(0, 8),
            }
          : { projectId: ctx.projectId, status: "unknown" },
        evidence: snapshot
          ? [
              toAgentEvidence({
                type: "DATABASE_STATE",
                sourceEntityType: "projects",
                sourceEntityId: ctx.projectId,
              }),
            ]
          : [],
        insufficientEvidence: !snapshot,
      };
    }),

    readSkill(baseDef("get_open_issues", "Open punch-list defects and field issues"), async (ctx) => {
      const [defectsRes, issuesRes] = await Promise.all([
        supabase
          .from("project_defects")
          .select("id, title, status, is_blocking, due_date")
          .eq("project_id", ctx.projectId)
          .eq("tenant_id", ctx.tenantId)
          .order("updated_at", { ascending: false })
          .limit(SKILL_LIMIT),
        supabase
          .from("project_issues")
          .select("id, title, status")
          .eq("project_id", ctx.projectId)
          .eq("tenant_id", ctx.tenantId)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(SKILL_LIMIT),
      ]);
      assertQueryOk(defectsRes.error, "get_open_issues");
      assertQueryOk(issuesRes.error, "get_open_issues");
      const defects = (defectsRes.data ?? []) as Array<{
        id: string;
        title: string;
        status: string;
        is_blocking: boolean;
        due_date: string | null;
      }>;
      const issues = (issuesRes.data ?? []) as Array<{ id: string; title: string; status: string }>;
      const openDefects = defects.filter((d) =>
        ["open", "in_progress", "ready_for_verification"].includes(d.status)
      );
      const fieldIssues = issues.slice(0, SKILL_LIMIT);
      const evidence = [
        ...openDefects.slice(0, 8).map((d) =>
          toAgentEvidence({
            type: "ISSUE",
            sourceEntityType: "project_defects",
            sourceEntityId: d.id,
            metadata: { title: d.title, blocking: d.is_blocking },
          })
        ),
        ...fieldIssues.slice(0, 8).map((i) =>
          toAgentEvidence({
            type: "ISSUE",
            sourceEntityType: "project_issues",
            sourceEntityId: i.id,
            metadata: { title: i.title },
          })
        ),
      ];
      return {
        output: {
          open: openDefects.length + fieldIssues.length,
          critical: openDefects.filter((d) => d.is_blocking).length,
          defects: openDefects.slice(0, SKILL_LIMIT).map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            blocking: d.is_blocking,
            dueDate: d.due_date,
          })),
          fieldIssues: fieldIssues.map((i) => ({ id: i.id, title: i.title, status: i.status })),
        },
        evidence,
        insufficientEvidence: false,
      };
    }),

    readSkill(baseDef("get_overdue_tasks", "Overdue worker tasks (bounded)"), async (ctx) => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("worker_tasks")
        .select("id, title, status, due_date, assigned_to, priority")
        .eq("tenant_id", ctx.tenantId)
        .eq("project_id", ctx.projectId)
        .in("status", ["pending", "in_progress"])
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(SKILL_LIMIT);
      assertQueryOk(error, "get_overdue_tasks");
      const rows = (data ?? []) as Array<{
        id: string;
        title: string;
        status: string;
        due_date: string | null;
        assigned_to: string | null;
        priority: string | null;
      }>;
      return {
        output: {
          count: rows.length,
          items: rows.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            dueDate: t.due_date,
            priority: t.priority,
          })),
        },
        evidence: rows.map((t) =>
          toAgentEvidence({
            type: "TASK",
            sourceEntityType: "worker_tasks",
            sourceEntityId: t.id,
            metadata: { title: t.title, dueDate: t.due_date },
          })
        ),
        insufficientEvidence: false,
      };
    }),

    readSkill(baseDef("get_recent_reports", "Recent submitted reports (7 days, bounded)"), async (ctx) => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      let rows;
      try {
        rows = await listReportsForManager(supabase, ctx.tenantId, {
          projectId: ctx.projectId,
          from: from.toISOString(),
          limit: SKILL_LIMIT,
        });
      } catch {
        throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_recent_reports", 503);
      }
      return {
        output: {
          count: rows.length,
          items: rows.map((r) => ({
            id: r.id,
            status: r.status,
            submittedAt: r.submitted_at,
            taskId: r.task_id,
          })),
        },
        evidence: rows.slice(0, 8).map((r) =>
          toAgentEvidence({
            type: "REPORT",
            sourceEntityType: "worker_reports",
            sourceEntityId: r.id,
          })
        ),
        insufficientEvidence: false,
      };
    }),

    readSkill(
      baseDef("get_project_members", "Active project members", { managerOnly: true }),
      async (ctx) => {
        const { data, error } = await supabase
          .from("project_members")
          .select("user_id, role, status")
          .eq("tenant_id", ctx.tenantId)
          .eq("project_id", ctx.projectId)
          .eq("status", "active")
          .limit(SKILL_LIMIT);
        assertQueryOk(error, "get_project_members");
        const rows = (data ?? []) as Array<{ user_id: string; role: string; status: string }>;
        return {
          output: {
            count: rows.length,
            members: rows.map((m) => ({ userId: m.user_id, role: m.role })),
          },
          evidence: [
            toAgentEvidence({
              type: "DATABASE_STATE",
              sourceEntityType: "project_members",
              sourceEntityId: ctx.projectId,
            }),
          ],
          insufficientEvidence: rows.length === 0,
        };
      }
    ),

    readSkill(baseDef("get_project_evidence", "Evidence coverage and gaps"), async (ctx) => {
      const insights = await getMissingEvidenceInsights(supabase, ctx.projectId, ctx.tenantId);
      const { count, error } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("project_id", ctx.projectId);
      assertQueryOk(error, "get_project_evidence");
      return {
        output: {
          mediaCount: count ?? 0,
          gapCount: insights.length,
          gaps: insights.slice(0, SKILL_LIMIT).map((g) => ({
            id: g.id,
            type: g.type,
            explanation: g.explanation,
            resourceType: g.evidenceReferences[0]?.resourceType,
            resourceId: g.evidenceReferences[0]?.resourceId,
          })),
        },
        evidence: insights.slice(0, 8).flatMap((g) =>
          g.evidenceReferences[0]?.resourceId
            ? [
                toAgentEvidence({
                  type: "TASK",
                  sourceEntityType: g.evidenceReferences[0]?.resourceType ?? "unknown",
                  sourceEntityId: g.evidenceReferences[0].resourceId,
                }),
              ]
            : []
        ),
        insufficientEvidence: (count ?? 0) === 0 && insights.length === 0,
      };
    }),

    readSkill(baseDef("get_project_risks", "Top project risks from existing intelligence"), async (ctx) => {
      const items = await getTopRiskInsights(supabase, ctx.projectId, ctx.tenantId, SKILL_LIMIT);
      return {
        output: {
          count: items.length,
          highCount: items.filter((r) => r.severity === "high").length,
          items: items.map((r) => ({
            id: r.id,
            title: r.title,
            severity: r.severity,
            explanation: r.explanation,
            resourceType: r.evidenceReferences[0]?.resourceType,
            resourceId: r.evidenceReferences[0]?.resourceId,
          })),
        },
        evidence: items
          .filter((r) => r.evidenceReferences[0]?.resourceId)
          .slice(0, 8)
          .map((r) =>
            toAgentEvidence({
              type: "DATABASE_STATE",
              sourceEntityType: r.evidenceReferences[0]?.resourceType ?? "project_risks",
              sourceEntityId: r.evidenceReferences[0]?.resourceId ?? r.id,
              metadata: { title: r.title, severity: r.severity },
            })
          ),
        insufficientEvidence: items.length === 0,
      };
    }),

    readSkill(baseDef("calculate_project_health", "Deterministic project health v1"), async (ctx) => {
      const health = await getProjectHealthScore(supabase, ctx.projectId, ctx.tenantId);
      const mapped: ProjectHealthV1 | null = health
        ? {
            score: health.score,
            band: scoreToBand(health.score),
            reasons: health.factorContributions.map((f) => f.explanation),
            blockers: health.blockers,
            confidence: health.confidence,
          }
        : null;
      return {
        output: mapped,
        evidence: [
          toAgentEvidence({
            type: "DATABASE_STATE",
            sourceEntityType: "projects",
            sourceEntityId: ctx.projectId,
          }),
        ],
        insufficientEvidence: !mapped || health?.confidence !== "high",
      };
    }),

    readSkill(baseDef("find_project_blockers", "Delivery blockers from verified signals only"), async (ctx) => {
      const [tasksRes, defectsRes, missing] = await Promise.all([
        supabase
          .from("worker_tasks")
          .select("id, status, due_date, assigned_to, title")
          .eq("project_id", ctx.projectId)
          .eq("tenant_id", ctx.tenantId)
          .in("status", ["pending", "in_progress"]),
        supabase
          .from("project_defects")
          .select("id, title, status, is_blocking")
          .eq("project_id", ctx.projectId)
          .eq("tenant_id", ctx.tenantId)
          .limit(SKILL_LIMIT),
        getMissingEvidenceInsights(supabase, ctx.projectId, ctx.tenantId),
      ]);
      assertQueryOk(tasksRes.error, "find_project_blockers");
      assertQueryOk(defectsRes.error, "find_project_blockers");
      const tasks = (tasksRes.data ?? []) as Array<{
        id: string;
        status: string;
        due_date: string | null;
        assigned_to: string | null;
        title: string;
      }>;
      const defects = (defectsRes.data ?? []) as Array<{
        id: string;
        title: string;
        status: string;
        is_blocking: boolean;
      }>;
      const today = new Date().toISOString().slice(0, 10);
      const taskSignals = tasks.map((t) => {
        const overdue = Boolean(t.due_date && t.due_date < today);
        const daysOverdue = t.due_date
          ? Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000)
          : 0;
        return {
          taskId: t.id,
          type: t.status === "in_progress" && overdue ? "blocked" : overdue ? "overdue" : "open",
          severity: daysOverdue > 7 ? "high" : daysOverdue > 2 ? "medium" : "low",
          message: t.title,
        };
      });
      const blockers: ProjectBlocker[] = findProjectBlockers({
        taskSignals,
        defects: defects.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          isBlocking: d.is_blocking,
        })),
        missingEvidence: missing.map((m) => ({
          id: m.id,
          resourceType: m.evidenceReferences[0]?.resourceType,
          resourceId: m.evidenceReferences[0]?.resourceId,
          explanation: m.explanation,
        })),
      });
      return {
        output: { count: blockers.length, items: blockers.slice(0, SKILL_LIMIT) },
        evidence: blockers.slice(0, 8).map((b) =>
          toAgentEvidence({
            type: b.evidenceType,
            sourceEntityType: b.sourceEntityType,
            sourceEntityId: b.sourceEntityId,
            metadata: { kind: b.kind },
          })
        ),
        insufficientEvidence: blockers.length === 0,
      };
    }),
  ];
}
