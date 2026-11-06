import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AgentError } from "../errors";
import type { AgentEvidence } from "../contracts/evidence.types";
import type { AgentExecutionContext } from "../types";
import { listPersistedImageSiteObservations } from "../site-intelligence/site-observation.repository";
import {
  EmptySkillInputSchema,
  type AgentSkill,
  type SkillDefinition,
  type SkillResult,
} from "./skill.types";

const SITE_OBSERVATION_LIMIT = 12;

const definition: SkillDefinition = {
  id: "get_site_observations",
  name: "get_site_observations",
  version: "1",
  description: "Latest persisted visual site observations for the current project",
  riskLevel: "LOW",
  executionMode: "READ",
  requiredPermissions: ["project:read"],
  inputSchema: EmptySkillInputSchema,
  outputSchema: z.unknown(),
  requiresProject: true,
  requiresEvidence: true,
  requiresApproval: false,
  handler: "get_site_observations",
};

export function createSiteIntelligenceSkills(supabase: SupabaseClient): AgentSkill[] {
  const skill: AgentSkill<Record<string, never>> = {
    definition,
    validateInput(input: unknown) {
      return EmptySkillInputSchema.parse(input ?? {}) as Record<string, never>;
    },
    async authorize(context: AgentExecutionContext) {
      if (!context.tenantId || !context.projectId) {
        throw new AgentError("AGENT_PROJECT_ACCESS_DENIED", "missing_scope", 403);
      }
    },
    async execute(context: AgentExecutionContext): Promise<SkillResult> {
      const rows = await listPersistedImageSiteObservations(supabase, {
        tenantId: context.tenantId,
        projectId: context.projectId,
        limit: SITE_OBSERVATION_LIMIT,
      });

      const usableRows = rows.filter((row) => !row.observation.insufficientEvidence);
      const withheldCount = rows.length - usableRows.length;
      const evidence = dedupeEvidence(
        usableRows.flatMap((row) => row.observation.evidence)
      );

      return {
        output: {
          count: usableRows.length,
          withheldForInsufficientProvenance: withheldCount,
          items: usableRows.map((row) => ({
            analysisId: row.analysisId,
            jobId: row.jobId,
            analysisCreatedAt: row.analysisCreatedAt,
            mediaId: row.observation.mediaId,
            evidenceTime: row.observation.evidenceTime,
            evidenceTimeSemantics: row.observation.evidenceTimeSemantics,
            stage: row.observation.stage,
            completionPercent: row.observation.completionPercent,
            riskLevel: row.observation.riskLevel,
            observations: row.observation.observations,
            recommendations: row.observation.recommendations,
            limitations: row.observation.limitations,
          })),
        },
        evidence,
        insufficientEvidence: usableRows.length === 0 || evidence.length === 0,
      };
    },
  };

  return [skill];
}

function dedupeEvidence(items: AgentEvidence[]): AgentEvidence[] {
  const seen = new Set<string>();
  const out: AgentEvidence[] = [];
  for (const item of items) {
    if (seen.has(item.evidenceId)) continue;
    seen.add(item.evidenceId);
    out.push(item);
  }
  return out.slice(0, 40);
}
