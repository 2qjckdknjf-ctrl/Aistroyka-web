#!/usr/bin/env bun
/**
 * Build expert review queue candidates from preference pairs and feedback records.
 *
 * Usage:
 *   bun scripts/ai/build-expert-review-queue.ts
 *   bun scripts/ai/build-expert-review-queue.ts --write --limit 10
 *   bun scripts/ai/build-expert-review-queue.ts --source preference_pairs|feedback|manual|all --live
 */

import {
  buildExpertReviewQueueFromCandidates,
  loadPreferencePairQueueCandidates,
  loadLowScoreFeedbackQueueCandidates,
} from "../../apps/web/lib/platform/ai-flywheel/expert-review-queue/expert-review-queue.candidate-builder";
import { isExpertReviewWriteEnabled } from "../../apps/web/lib/platform/ai-flywheel/expert-review-queue/expert-review-queue.flags";
import type { ExpertReviewQueueCandidate } from "../../apps/web/lib/platform/ai-flywheel/expert-review-queue/expert-review-queue.types";

const FIXTURE_CANDIDATES: ExpertReviewQueueCandidate[] = [
  {
    tenantId: "tenant-fixture",
    sourceTable: "manual_seed",
    sourceId: "00000000-0000-4000-8000-000000000101",
    taskType: "copilot_chat",
    audience: "manager",
    inputJson: { prompt: "Summarize schedule risk" },
    modelOutputJson: { answer: "Everything is fine." },
    provenance: "manual",
  },
  {
    tenantId: "tenant-fixture",
    sourceTable: "manual_seed",
    sourceId: "00000000-0000-4000-8000-000000000102",
    taskType: "copilot_chat",
    audience: "owner",
    inputJson: { prompt: "Estimate status" },
    modelOutputJson: { answer: "Internal margin risk 15%" },
    provenance: "manual",
  },
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const live = argv.includes("--live");
  const limitIdx = argv.indexOf("--limit");
  const tenantIdx = argv.indexOf("--tenant-id");
  const sourceIdx = argv.indexOf("--source");
  let source: "preference_pairs" | "feedback" | "manual" | "all" = "all";
  if (sourceIdx >= 0) {
    const v = argv[sourceIdx + 1];
    if (v === "preference_pairs" || v === "feedback" || v === "manual" || v === "all") source = v;
  }
  return {
    dryRun: !write,
    live,
    limit: limitIdx >= 0 ? Number(argv[limitIdx + 1]) || 100 : 100,
    tenantId: tenantIdx >= 0 ? argv[tenantIdx + 1] : undefined,
    source,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.dryRun && !isExpertReviewWriteEnabled()) {
    process.stderr.write(
      "Write requires AI_FLYWHEEL_ENABLED + AI_EXPERT_REVIEW_QUEUE_ENABLED + AI_EXPERT_REVIEW_WRITE_ENABLED=true\n"
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
    const loaded: ExpertReviewQueueCandidate[] = [];
    if (args.source === "preference_pairs" || args.source === "all") {
      loaded.push(
        ...(await loadPreferencePairQueueCandidates(supabase, {
          tenantId: args.tenantId,
          limit: args.limit,
        }))
      );
    }
    if (args.source === "feedback" || args.source === "all") {
      loaded.push(
        ...(await loadLowScoreFeedbackQueueCandidates(supabase, {
          tenantId: args.tenantId,
          limit: args.limit,
        }))
      );
    }
    candidates = loaded.length ? loaded : [];
  } else if (args.source === "manual" || args.source === "all") {
    candidates = FIXTURE_CANDIDATES;
  } else {
    candidates = [];
  }

  const { stats } = await buildExpertReviewQueueFromCandidates(supabase, candidates, {
    dryRun: args.dryRun,
  });

  console.log([
    `mode: ${args.dryRun ? "dry-run" : "write"}`,
    `write_flag: ${isExpertReviewWriteEnabled()}`,
    `candidates_scanned: ${stats.candidatesScanned}`,
    `pii_rejected: ${stats.piiRejected}`,
    `finance_rejected: ${stats.financeRejected}`,
    `duplicate_skipped: ${stats.duplicateSkipped}`,
    `eligible: ${stats.eligible}`,
    `written: ${stats.written}`,
  ].join("\n"));
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
