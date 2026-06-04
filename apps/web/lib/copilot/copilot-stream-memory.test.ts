import { describe, expect, it } from "vitest";
import {
  formatMemoryContextSection,
  memoryRecordsToChunks,
} from "./copilot-stream-memory";
import type { AiMemoryRecord } from "@/lib/ai-brain/phase-c/memory/memory.types";

function sampleRecord(overrides: Partial<AiMemoryRecord> = {}): AiMemoryRecord {
  return {
    memoryId: "m1",
    tenantId: "t1",
    projectId: "p1",
    userId: null,
    memoryType: "project_working",
    scope: "project",
    sourceKind: "system_derived",
    sourceRef: null,
    title: "Delay risk",
    body: "Concrete pour slipped two days",
    factsUsed: [],
    groundingRefs: [],
    confidence: "high",
    expiresAt: null,
    status: "active",
    supersededBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("copilot-stream-memory", () => {
  it("maps memory records to scored chunks", () => {
    const chunks = memoryRecordsToChunks([sampleRecord()]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain("Delay risk");
    expect(chunks[0].score).toBe(1);
  });

  it("formats memory section for system prompt", () => {
    const section = formatMemoryContextSection(memoryRecordsToChunks([sampleRecord()]));
    expect(section).toContain("Relevant project memory:");
    expect(section).toContain("Delay risk");
  });

  it("returns empty section when no chunks", () => {
    expect(formatMemoryContextSection([])).toBe("");
  });
});
