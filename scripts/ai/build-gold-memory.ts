#!/usr/bin/env bun
/**
 * Build gold memory rows from expert reviews and preference pairs.
 *
 * Usage:
 *   bun scripts/ai/build-gold-memory.ts                    # dry-run (fixtures)
 *   bun scripts/ai/build-gold-memory.ts --write            # write (requires flags + Supabase)
 *   bun scripts/ai/build-gold-memory.ts --limit 50
 *   bun scripts/ai/build-gold-memory.ts --task-type copilot_chat
 *   bun scripts/ai/build-gold-memory.ts --tenant-id <uuid>
 *   bun scripts/ai/build-gold-memory.ts --source expert_reviews|preference_pairs|all
 *   bun scripts/ai/build-gold-memory.ts --live             # load from Supabase instead of fixtures
 */

import {
  buildGoldMemoryFromCandidates,
  loadExpertReviewCandidates,
  loadPreferencePairCandidates,
} from "../../apps/web/lib/platform/ai-flywheel/gold-memory/gold-memory.builder";
import { isAiGoldMemoryWriteEnabled } from "../../apps/web/lib/platform/ai-flywheel/gold-memory/gold-memory.flags";
import type { GoldMemoryBuildStats } from "../../apps/web/lib/platform/ai-flywheel/gold-memory/gold-memory.types";

const FIXTURE_CANDIDATES = [
  {
    tenantId: "tenant-no-consent",
    taskType: "copilot_chat",
    audience: "manager" as const,
    provenance: "expert_review" as const,
    sourceTable: "ai_expert_reviews",
    sourceId: "00000000-0000-4000-8000-000000000001",
    inputJson: { prompt: "What is the schedule risk?" },
    goldOutputJson: { answer: "Review milestone M3 delay signals." },
    rationale: "Expert correction",
    consent: false,
  },
  {
    tenantId: "tenant-consent",
    taskType: "copilot_chat",
    audience: "owner" as const,
    provenance: "manager_preference_pair" as const,
    sourceTable: "ai_preference_pairs",
    sourceId: "00000000-0000-4000-8000-000000000002",
    inputJson: { prompt: "Summarize estimate status" },
    goldOutputJson: { answer: "Estimate for approval: kitchen renovation" },
    consent: true,
  },
  {
    tenantId: "tenant-consent",
    taskType: "copilot_chat",
    audience: "owner" as const,
    provenance: "manager_preference_pair" as const,
    sourceTable: "ai_preference_pairs",
    sourceId: "00000000-0000-4000-8000-000000000003",
    inputJson: { prompt: "Budget review" },
    goldOutputJson: { answer: "Internal margin risk 12% on subcontractor cost" },
    consent: true,
  },
  {
    tenantId: "tenant-consent",
    taskType: "copilot_chat",
    audience: "manager" as const,
    provenance: "expert_review" as const,
    sourceTable: "ai_expert_reviews",
    sourceId: "00000000-0000-4000-8000-000000000004",
    inputJson: { prompt: "Contact user@example.com about delay" },
    goldOutputJson: { answer: "Notify site lead about delay" },
    consent: true,
  },
  {
    tenantId: "tenant-consent",
    taskType: "copilot_chat",
    audience: "manager" as const,
    provenance: "expert_review" as const,
    sourceTable: "ai_expert_reviews",
    sourceId: "00000000-0000-4000-8000-000000000005",
    inputJson: { prompt: "Daily control summary" },
    goldOutputJson: { answer: "Focus on open defects and pending approvals." },
    rationale: "Manager gold",
    consent: true,
  },
];

function formatStats(stats: GoldMemoryBuildStats, dryRun: boolean): string {
  return [
    `mode: ${dryRun ? "dry-run" : "write"}`,
    `write_flag: ${isAiGoldMemoryWriteEnabled()}`,
    `candidates_scanned: ${stats.candidatesScanned}`,
    `consent_rejected: ${stats.consentRejected}`,
    `pii_rejected: ${stats.piiRejected}`,
    `finance_rejected: ${stats.financeRejected}`,
    `duplicate_skipped: ${stats.duplicateSkipped}`,
    `embedding_skipped: ${stats.embeddingSkipped}`,
    `eligible: ${stats.eligible}`,
    `written: ${stats.written}`,
  ].join("\n");
}

function parseArgs(): {
  dryRun: boolean;
  live: boolean;
  limit: number;
  taskType?: string;
  tenantId?: string;
  source: "expert_reviews" | "preference_pairs" | "all";
} {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const live = argv.includes("--live");
  const limitIdx = argv.indexOf("--limit");
  const taskIdx = argv.indexOf("--task-type");
  const tenantIdx = argv.indexOf("--tenant-id");
  const sourceIdx = argv.indexOf("--source");

  let source: "expert_reviews" | "preference_pairs" | "all" = "all";
  if (sourceIdx >= 0) {
    const v = argv[sourceIdx + 1];
    if (v === "expert_reviews" || v === "preference_pairs" || v === "all") source = v;
  }

  return {
    dryRun: !write,
    live,
    limit: limitIdx >= 0 ? Number(argv[limitIdx + 1]) || 100 : 100,
    taskType: taskIdx >= 0 ? argv[taskIdx + 1] : undefined,
    tenantId: tenantIdx >= 0 ? argv[tenantIdx + 1] : undefined,
    source,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.dryRun && !isAiGoldMemoryWriteEnabled()) {
    process.stderr.write(
      "Write mode requires AI_FLYWHEEL_ENABLED + AI_GOLD_MEMORY_ENABLED + AI_GOLD_MEMORY_WRITE_ENABLED=true\n"
    );
    process.exit(1);
  }

  let supabase = null;
  let candidates = FIXTURE_CANDIDATES;

  if (args.live) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      process.stderr.write("--live requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n");
      process.exit(1);
    }
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(url, key);

    const loaded: typeof FIXTURE_CANDIDATES = [];
    if (args.source === "expert_reviews" || args.source === "all") {
      loaded.push(...(await loadExpertReviewCandidates(supabase, { tenantId: args.tenantId, limit: args.limit })));
    }
    if (args.source === "preference_pairs" || args.source === "all") {
      loaded.push(...(await loadPreferencePairCandidates(supabase, { tenantId: args.tenantId, limit: args.limit })));
    }
    candidates = loaded;
  }

  if (args.taskType) {
    candidates = candidates.filter((c) => c.taskType === args.taskType);
  }

  const result = await buildGoldMemoryFromCandidates(supabase, candidates, {
    dryRun: args.dryRun,
  });

  console.log(formatStats(result.stats, args.dryRun));
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
