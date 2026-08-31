/**
 * Typed skill contract. Skills are controlled capabilities, not prompts.
 */

import { z } from "zod";
import type { AgentExecutionContext, SkillExecutionMode, SkillRiskLevel } from "../types";
import type { AgentEvidence } from "../contracts/evidence.types";

export interface SkillDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  riskLevel: SkillRiskLevel;
  executionMode: SkillExecutionMode;
  requiredPermissions: string[];
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  requiresProject: boolean;
  requiresEvidence: boolean;
  requiresApproval: boolean;
  handler: string;
  managerOnly?: boolean;
}

export interface SkillResult<O = unknown> {
  output: O;
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
}

export interface AgentSkill<I = unknown, O = unknown> {
  definition: SkillDefinition;
  validateInput(input: unknown): I;
  authorize(context: AgentExecutionContext): Promise<void>;
  execute(context: AgentExecutionContext, input: I): Promise<SkillResult<O>>;
}

export const EmptySkillInputSchema = z.object({}).strip();

export type EmptySkillInput = z.infer<typeof EmptySkillInputSchema>;
