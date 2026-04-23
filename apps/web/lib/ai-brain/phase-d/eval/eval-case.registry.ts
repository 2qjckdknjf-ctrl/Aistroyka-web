/**
 * AI Brain Phase D — Eval case registry.
 * Loads cases from DB when available; falls back to in-memory seed cases.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiEvalCase, ExpectedAssertion } from "./eval-case.types";
import { SEED_EVAL_CASES } from "./seed-cases";

export interface ListEvalCasesOptions {
  mode?: string;
  active?: boolean;
  tags?: string[];
}

export async function listEvalCases(
  supabase: SupabaseClient | null,
  options: ListEvalCasesOptions = {}
): Promise<AiEvalCase[]> {
  if (supabase) {
    let q = supabase
      .from("ai_eval_cases")
      .select("id, title, scenario_type, mode, required_inputs, expected_assertions, grading_strategy, tags, active, created_at")
      .order("created_at", { ascending: true });

    if (options.active !== undefined) {
      q = q.eq("active", options.active);
    }
    if (options.mode) {
      q = q.eq("mode", options.mode);
    }
    if (options.tags?.length) {
      q = q.overlaps("tags", options.tags);
    }

    const { data, error } = await q;
    if (!error && data?.length) {
      return (data as Record<string, unknown>[]).map(mapRowToCase);
    }
  }

  return SEED_EVAL_CASES.map((c, i) => ({
    id: `seed-${i}`,
    title: c.title,
    scenarioType: c.scenarioType,
    mode: c.mode,
    requiredInputs: (c.requiredInputs ?? {}) as Record<string, unknown>,
    expectedAssertions: (c.expectedAssertions ?? []) as ExpectedAssertion[],
    gradingStrategy: (c.gradingStrategy ?? "strict") as AiEvalCase["gradingStrategy"],
    tags: c.tags ?? [],
    active: c.active ?? true,
    createdAt: new Date().toISOString(),
  }));
}

function mapRowToCase(row: Record<string, unknown>): AiEvalCase {
  return {
    id: row.id as string,
    title: row.title as string,
    scenarioType: row.scenario_type as string,
    mode: row.mode as string,
    requiredInputs: (row.required_inputs as Record<string, unknown>) ?? {},
    expectedAssertions: (row.expected_assertions as ExpectedAssertion[]) ?? [],
    gradingStrategy: (row.grading_strategy as AiEvalCase["gradingStrategy"]) ?? "strict",
    tags: (row.tags as string[]) ?? [],
    active: (row.active as boolean) ?? true,
    createdAt: row.created_at as string,
  };
}
