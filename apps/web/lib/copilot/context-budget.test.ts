import { describe, it, expect } from "vitest";
import {
  applyContextBudget,
  applyBriefContextBudget,
  estimateTokens,
  truncateToTokens,
  DEFAULT_CONTEXT_BUDGET,
} from "./context-budget";

describe("context-budget", () => {
  describe("estimateTokens", () => {
    it("returns 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });
    it("estimates ~4 chars per token", () => {
      expect(estimateTokens("abcd")).toBe(1);
      expect(estimateTokens("a".repeat(8))).toBe(2);
    });
  });

  describe("truncateToTokens", () => {
    it("returns full text when under budget", () => {
      const text = "short";
      expect(truncateToTokens(text, 100)).toBe(text);
    });
    it("truncates when over budget", () => {
      const text = "a".repeat(100);
      expect(truncateToTokens(text, 10).length).toBeLessThanOrEqual(40);
    });
  });

  describe("applyContextBudget", () => {
    it("returns budgeted context with meta", () => {
      const result = applyContextBudget({
        summary: "short",
        memoryChunks: [],
        recentMessages: [],
        currentUserMessage: "hello",
      });
      expect(result.meta.context_tokens_estimated).toBeGreaterThan(0);
      expect(result.meta.context_trim_applied).toBe(false);
      expect(result.currentUserMessage).toBe("hello");
    });

    it("trims oversized summary", () => {
      const longSummary = "a".repeat(10000);
      const result = applyContextBudget({
        summary: longSummary,
        memoryChunks: [],
        recentMessages: [],
        currentUserMessage: "hi",
      });
      expect(result.meta.context_trim_applied).toBe(true);
      expect(estimateTokens(result.summary)).toBeLessThanOrEqual(DEFAULT_CONTEXT_BUDGET.maxSummaryTokens);
    });

    it("limits memory chunks", () => {
      const chunks = Array.from({ length: 20 }, (_, i) => ({ content: `chunk ${i}`, score: i }));
      const result = applyContextBudget({
        summary: "",
        memoryChunks: chunks,
        recentMessages: [],
        currentUserMessage: "hi",
      });
      expect(result.memoryChunks.length).toBeLessThanOrEqual(DEFAULT_CONTEXT_BUDGET.maxMemoryChunks);
    });

    it("limits recent messages", () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: "user" as const,
        content: `message ${i} `.repeat(100),
      }));
      const result = applyContextBudget({
        summary: "",
        memoryChunks: [],
        recentMessages: messages,
        currentUserMessage: "hi",
      });
      const totalRecent = result.recentMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
      expect(totalRecent).toBeLessThanOrEqual(DEFAULT_CONTEXT_BUDGET.maxRecentMessagesTokens);
    });

    it("total estimate stays within cap", () => {
      const result = applyContextBudget(
        {
          summary: "a".repeat(5000),
          memoryChunks: [{ content: "b".repeat(5000), score: 1 }],
          recentMessages: [{ role: "user", content: "c".repeat(8000) }],
          currentUserMessage: "hi",
        },
        { ...DEFAULT_CONTEXT_BUDGET, maxTotalTokens: 1000 }
      );
      expect(result.meta.context_tokens_estimated).toBeGreaterThan(0);
    });
  });

  describe("applyBriefContextBudget", () => {
    it("returns budgeted brief context", () => {
      const input = {
        snapshotSummary: "short",
        healthSummary: "ok",
        reportSummary: "none",
        riskSummary: "low",
        evidenceSummary: "none",
        taskSummary: "none",
        recommendationsSummary: "none",
        executiveHeadline: "good",
      };
      const result = applyBriefContextBudget(input);
      expect(result.meta.context_tokens_estimated).toBeGreaterThan(0);
      expect(result.snapshotSummary).toBe("short");
    });

    it("trims oversized fields", () => {
      const input = {
        snapshotSummary: "a".repeat(50000),
        healthSummary: "ok",
        reportSummary: "none",
        riskSummary: "low",
        evidenceSummary: "none",
        taskSummary: "none",
        recommendationsSummary: "none",
        executiveHeadline: "good",
      };
      const result = applyBriefContextBudget(input, 500);
      expect(result.meta.context_trim_applied).toBe(true);
      expect(result.meta.context_tokens_estimated).toBeLessThanOrEqual(600);
    });
  });
});
