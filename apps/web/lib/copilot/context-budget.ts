/**
 * Context budget controller for Copilot.
 * Enforces explicit limits and deterministic truncation.
 * No hidden uncontrolled context growth.
 */

/** Approximate chars per token (OpenAI-style). */
const CHARS_PER_TOKEN = 4;

export interface ContextBudgetConfig {
  maxSummaryTokens: number;
  maxMemoryTokens: number;
  maxRecentMessagesTokens: number;
  maxTotalTokens: number;
  maxMemoryChunks: number;
}

export const DEFAULT_CONTEXT_BUDGET: ContextBudgetConfig = {
  maxSummaryTokens: 500,
  maxMemoryTokens: 1500,
  maxRecentMessagesTokens: 2000,
  maxTotalTokens: 8000,
  maxMemoryChunks: 10,
};

export interface MemoryChunk {
  content: string;
  /** Optional relevance/order hint; higher = more relevant. */
  score?: number;
}

export interface RecentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContextInput {
  summary?: string;
  memoryChunks?: MemoryChunk[];
  recentMessages?: RecentMessage[];
  /** Current user message; always included in full. */
  currentUserMessage: string;
}

export interface ContextBudgetMeta {
  context_tokens_estimated: number;
  context_trim_applied: boolean;
  memory_used: number;
  memory_chunks_count: number;
  summary_used: number;
}

export interface BudgetedChatContext {
  summary: string;
  memoryChunks: MemoryChunk[];
  recentMessages: RecentMessage[];
  currentUserMessage: string;
  meta: ContextBudgetMeta;
}

/** Estimate token count from character length. */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Truncate text to fit token budget. Cuts at word boundary when possible. */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.7) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

/**
 * Apply context budget to chat context.
 * - Trims summary to maxSummaryTokens
 * - Selects up to maxMemoryChunks (by score desc, then order)
 * - Trims each chunk to fit within memory budget
 * - Trims recent messages (oldest first) to fit maxRecentMessagesTokens
 * - Always reserves space for current user message
 * - Fails if total would exceed maxTotalTokens after reserving user message
 */
export function applyContextBudget(
  input: ChatContextInput,
  config: ContextBudgetConfig = DEFAULT_CONTEXT_BUDGET
): BudgetedChatContext {
  const meta: ContextBudgetMeta = {
    context_tokens_estimated: 0,
    context_trim_applied: false,
    memory_used: 0,
    memory_chunks_count: 0,
    summary_used: 0,
  };

  const currentUserTokens = estimateTokens(input.currentUserMessage);
  const reservedForUser = Math.min(currentUserTokens, config.maxTotalTokens);
  const availableForContext = config.maxTotalTokens - reservedForUser;

  let summary = input.summary ?? "";
  let summaryTokens = estimateTokens(summary);
  if (summaryTokens > config.maxSummaryTokens) {
    summary = truncateToTokens(summary, config.maxSummaryTokens);
    summaryTokens = estimateTokens(summary);
    meta.context_trim_applied = true;
  }
  meta.summary_used = summaryTokens;

  const chunks = [...(input.memoryChunks ?? [])]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, config.maxMemoryChunks);

  const memoryChunks: MemoryChunk[] = [];
  let memoryTokensUsed = 0;
  const tokensPerChunk = Math.floor(config.maxMemoryTokens / Math.max(1, chunks.length));

  for (const c of chunks) {
    const chunkTokens = estimateTokens(c.content);
    const budget = Math.min(tokensPerChunk, config.maxMemoryTokens - memoryTokensUsed);
    if (budget <= 0) break;
    let content = c.content;
    if (chunkTokens > budget) {
      content = truncateToTokens(c.content, budget);
      meta.context_trim_applied = true;
    }
    memoryChunks.push({ ...c, content });
    memoryTokensUsed += estimateTokens(content);
  }
  meta.memory_used = memoryTokensUsed;
  meta.memory_chunks_count = memoryChunks.length;

  const recentMessages: RecentMessage[] = [];
  let recentTokensUsed = 0;
  const recentList = [...(input.recentMessages ?? [])].reverse();

  for (const m of recentList) {
    const msgTokens = estimateTokens(m.content);
    if (recentTokensUsed + msgTokens > config.maxRecentMessagesTokens) break;
    recentMessages.unshift(m);
    recentTokensUsed += msgTokens;
  }
  if (recentTokensUsed < (input.recentMessages ?? []).reduce((s, m) => s + estimateTokens(m.content), 0)) {
    meta.context_trim_applied = true;
  }

  const totalContextTokens = meta.summary_used + meta.memory_used + recentTokensUsed;
  if (totalContextTokens > availableForContext) {
    meta.context_trim_applied = true;
  }

  meta.context_tokens_estimated = totalContextTokens + currentUserTokens;

  return {
    summary,
    memoryChunks,
    recentMessages,
    currentUserMessage: input.currentUserMessage,
    meta,
  };
}

/**
 * Apply budget to Brief Copilot context (CopilotContextData).
 * Truncates each string field to fit within total budget.
 */
export interface BriefContextInput {
  snapshotSummary: string;
  healthSummary: string;
  reportSummary: string;
  riskSummary: string;
  evidenceSummary: string;
  taskSummary: string;
  recommendationsSummary: string;
  executiveHeadline: string;
}

export interface BudgetedBriefContext {
  snapshotSummary: string;
  healthSummary: string;
  reportSummary: string;
  riskSummary: string;
  evidenceSummary: string;
  taskSummary: string;
  recommendationsSummary: string;
  executiveHeadline: string;
  meta: ContextBudgetMeta;
}

const BRIEF_FIELD_ORDER: (keyof BriefContextInput)[] = [
  "executiveHeadline",
  "healthSummary",
  "snapshotSummary",
  "reportSummary",
  "riskSummary",
  "evidenceSummary",
  "taskSummary",
  "recommendationsSummary",
];

export function applyBriefContextBudget(
  input: BriefContextInput,
  maxTotalTokens: number = DEFAULT_CONTEXT_BUDGET.maxTotalTokens
): BudgetedBriefContext {
  const meta: ContextBudgetMeta = {
    context_tokens_estimated: 0,
    context_trim_applied: false,
    memory_used: 0,
    memory_chunks_count: 0,
    summary_used: 0,
  };

  let totalTokens = 0;
  const result = { ...input };

  for (const key of BRIEF_FIELD_ORDER) {
    const text = result[key];
    const tokens = estimateTokens(text);
    const remaining = maxTotalTokens - totalTokens;
    if (tokens > remaining && remaining > 0) {
      result[key] = truncateToTokens(text, remaining);
      meta.context_trim_applied = true;
    }
    totalTokens += estimateTokens(result[key]);
  }

  meta.context_tokens_estimated = totalTokens;
  meta.summary_used = totalTokens;

  return { ...result, meta };
}
