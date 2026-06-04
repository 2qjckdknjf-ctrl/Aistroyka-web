import type { SupabaseClient } from "@supabase/supabase-js";
import { getRelevantMemoryForRun } from "@/lib/ai-brain/phase-c";
import type { AiMemoryConfidence, AiMemoryRecord } from "@/lib/ai-brain/phase-c/memory/memory.types";
import {
  DEFAULT_CONTEXT_BUDGET,
  type MemoryChunk,
} from "@/lib/copilot/context-budget";

const CONFIDENCE_SCORE: Record<AiMemoryConfidence, number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
};

function memoryBodyText(record: AiMemoryRecord): string {
  if (typeof record.body === "string" && record.body.trim()) return record.body.trim();
  if (record.factsUsed.length > 0) return record.factsUsed.join("; ");
  if (record.body != null && typeof record.body === "object") {
    try {
      return JSON.stringify(record.body);
    } catch {
      return "";
    }
  }
  return "";
}

export function memoryRecordsToChunks(records: AiMemoryRecord[]): MemoryChunk[] {
  return records.map((m) => {
    const body = memoryBodyText(m);
    const content = body ? `${m.title}: ${body}` : m.title;
    return {
      content: content.slice(0, 4000),
      score: CONFIDENCE_SCORE[m.confidence] ?? 0.3,
    };
  });
}

export function formatMemoryContextSection(chunks: MemoryChunk[]): string {
  if (!chunks.length) return "";
  const lines = chunks.map((c) => `- ${c.content}`);
  return `Relevant project memory:\n${lines.join("\n")}`;
}

/** Phase C retrieval for copilot stream context budget (best-effort; empty on failure). */
export async function loadCopilotStreamMemoryChunks(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string | null
): Promise<MemoryChunk[]> {
  try {
    const records = await getRelevantMemoryForRun(supabase, tenantId, {
      projectId,
      userId: userId ?? undefined,
      mode: "manager_assist",
      limit: DEFAULT_CONTEXT_BUDGET.maxMemoryChunks,
    });
    return memoryRecordsToChunks(records);
  } catch {
    return [];
  }
}
