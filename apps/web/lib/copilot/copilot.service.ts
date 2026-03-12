/**
 * Copilot service: orchestrates use cases with context, prompt, provider, and fallback.
 * Single entry for all Copilot use cases; no direct LLM calls outside provider.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ILLMAdapter } from "@/lib/ai-brain/types";
import { buildCopilotContext } from "./copilot.context-builder";
import { buildPrompt } from "./copilot.prompt-builder";
import { parseCopilotOutput, toCopilotResponse } from "./copilot.output-parser";
import {
  nullCopilotProvider,
  createAdapterCopilotProvider,
  type ICopilotProvider,
} from "./copilot.provider";
import { deterministicFallback } from "./copilot.fallback";
import type { CopilotRequest, CopilotResponse, CopilotUseCase } from "./copilot.types";

export interface CopilotServiceOptions {
  supabase: SupabaseClient;
  /** Prefer this when set; otherwise llmAdapter is wrapped into a provider. */
  copilotProvider?: ICopilotProvider | null;
  /** Legacy: wrapped into ICopilotProvider when copilotProvider not set. */
  llmAdapter?: ILLMAdapter | null;
}

function resolveProvider(options: CopilotServiceOptions): ICopilotProvider {
  if (options.copilotProvider) return options.copilotProvider;
  if (options.llmAdapter) return createAdapterCopilotProvider(options.llmAdapter);
  return nullCopilotProvider;
}

export async function runCopilot(
  request: CopilotRequest,
  options: CopilotServiceOptions
): Promise<CopilotResponse> {
  const useCase = request.useCase;
  const context = await buildCopilotContext(options.supabase, request);

  if (!context) {
    const raw = "Project not found or no data.";
    const parsed = parseCopilotOutput(useCase, raw, "deterministic");
    return toCopilotResponse(useCase, parsed, "deterministic");
  }

  const prompt = buildPrompt(useCase, context);
  const provider = resolveProvider(options);

  let result: { raw: string; structured?: Record<string, unknown> };
  let source: "llm" | "deterministic" | "mock" = "deterministic";

  if (provider.isAvailable()) {
    try {
      result = await provider.generateFromPrompt(prompt, useCase, context);
      source = "llm";
    } catch {
      result = deterministicFallback(useCase, context);
    }
  } else {
    result = deterministicFallback(useCase, context);
  }

  const parsed = parseCopilotOutput(
    useCase,
    result.structured ?? result.raw,
    source
  );
  return toCopilotResponse(useCase, parsed, source);
}

export async function summarizeProjectStatus(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "summarizeProjectStatus", projectId, tenantId },
    { supabase, llmAdapter }
  );
}

export async function summarizeDailyReports(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  dateFrom?: string,
  dateTo?: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "summarizeDailyReports", projectId, tenantId, dateFrom, dateTo },
    { supabase, llmAdapter }
  );
}

export async function detectTopRisks(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "detectTopRisks", projectId, tenantId },
    { supabase, llmAdapter }
  );
}

export async function findMissingEvidence(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "findMissingEvidence", projectId, tenantId },
    { supabase, llmAdapter }
  );
}

export async function identifyBlockedTasks(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "identifyBlockedTasks", projectId, tenantId },
    { supabase, llmAdapter }
  );
}

export async function generateManagerBrief(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "generateManagerBrief", projectId, tenantId },
    { supabase, llmAdapter }
  );
}

export async function generateExecutiveBrief(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  portfolioId?: string,
  llmAdapter?: ILLMAdapter | null
): Promise<CopilotResponse> {
  return runCopilot(
    { useCase: "generateExecutiveBrief", projectId, tenantId, portfolioId },
    { supabase, llmAdapter }
  );
}
