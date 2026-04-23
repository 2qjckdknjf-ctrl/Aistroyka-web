/**
 * AI Brain Phase C — Memory service.
 * Typed, scoped memory. Assistive context only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiMemoryRecord, AiMemoryType } from "./memory.types";
import { computeExpiresAt, isExpired } from "./memory-boundaries";
import { evaluateWritePolicy } from "./write-policy.evaluator";
import {
  createMemoryRecord as repoCreate,
  getRelevantMemory,
  markMemorySuperseded,
  expireMemory,
} from "../storage/memory.repository";
import type { CreateMemoryInput } from "../storage/memory.repository";

export interface CreateMemoryParams {
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
  memoryType: AiMemoryType;
  scope: AiMemoryRecord["scope"];
  sourceKind: AiMemoryRecord["sourceKind"];
  sourceRef?: string | null;
  title: string;
  body: unknown;
  factsUsed?: string[];
  groundingRefs?: string[];
}

export type CreateMemoryResult =
  | { success: true; record: AiMemoryRecord }
  | { success: false; reason: string };

export async function createMemoryRecord(
  supabase: SupabaseClient,
  params: CreateMemoryParams
): Promise<CreateMemoryResult> {
  const policy = evaluateWritePolicy({
    memoryType: params.memoryType,
    sourceKind: params.sourceKind,
    hasGroundingRefs: (params.groundingRefs?.length ?? 0) > 0,
    tenantId: params.tenantId,
    projectId: params.projectId,
    userId: params.userId,
  });

  if (!policy.allowed) {
    return { success: false, reason: policy.reason };
  }

  const now = new Date();
  const expiresAt = computeExpiresAt(params.memoryType, now);

  const input: CreateMemoryInput = {
    tenantId: params.tenantId,
    projectId: params.projectId,
    userId: params.userId,
    memoryType: params.memoryType,
    scope: params.scope,
    sourceKind: params.sourceKind,
    sourceRef: params.sourceRef,
    title: params.title,
    body: params.body,
    factsUsed: params.factsUsed,
    groundingRefs: params.groundingRefs,
    confidence: policy.confidence,
    expiresAt,
  };

  const record = await repoCreate(supabase, input);
  if (!record) return { success: false, reason: "Repository create failed" };
  return { success: true, record };
}

export async function getRelevantMemoryForRun(
  supabase: SupabaseClient,
  tenantId: string,
  opts: {
    projectId?: string | null;
    userId?: string | null;
    mode?: string;
    limit?: number;
  }
): Promise<AiMemoryRecord[]> {
  const types: AiMemoryType[] = ["project_working", "user_preference"];
  if (opts.mode === "manager_assist" || opts.mode === "executive_summary") {
    types.push("learning_candidate");
  }

  const rows = await getRelevantMemory(supabase, tenantId, {
    projectId: opts.projectId,
    userId: opts.userId,
    memoryTypes: types,
    limit: opts.limit ?? 10,
  });

  const now = new Date().toISOString();
  return rows.filter((r) => !isExpired(r.expiresAt) && r.status === "active");
}

export async function getProjectWorkingMemory(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  limit = 5
): Promise<AiMemoryRecord[]> {
  const rows = await getRelevantMemory(supabase, tenantId, {
    projectId,
    memoryTypes: ["project_working"],
    limit,
  });
  const now = new Date().toISOString();
  return rows.filter((r) => !isExpired(r.expiresAt));
}

export async function getUserPreferenceMemory(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  limit = 5
): Promise<AiMemoryRecord[]> {
  const rows = await getRelevantMemory(supabase, tenantId, {
    userId,
    memoryTypes: ["user_preference"],
    limit,
  });
  const now = new Date().toISOString();
  return rows.filter((r) => !isExpired(r.expiresAt));
}

export { markMemorySuperseded, expireMemory };
