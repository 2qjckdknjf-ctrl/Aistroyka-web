# Copilot Foundation

## Overview

The Copilot is a **management assistant** over AI Brain data. It supports use cases: project status summary, daily reports summary, top risks, missing evidence, blocked tasks, manager brief, executive brief. All LLM calls go through a **provider boundary**; business logic never calls an AI provider directly.

## Structure

| File | Role |
|------|------|
| `copilot.types.ts` | `CopilotUseCase`, `CopilotRequest`, `CopilotResponse` |
| `copilot.context-builder.ts` | Builds context from AI Brain (snapshot, health, signals, recommendations) |
| `copilot.prompt-builder.ts` | Builds prompt string per use case (no LLM calls) |
| `copilot.provider.ts` | **Adapter boundary**: `ICopilotProvider`, `nullCopilotProvider`, `createAdapterCopilotProvider(ILLMAdapter)` |
| `copilot.fallback.ts` | Deterministic, use-case-specific fallback when no provider |
| `copilot.output-parser.ts` | Parses raw/structured output into `CopilotResponse` |
| `copilot.service.ts` | Orchestrates: context → prompt → provider or fallback → parse → response |

## Flow

1. **Context** — `buildCopilotContext(supabase, request)` uses AI Brain services (health, risks, reports, evidence, tasks, recommendations, executive summary).
2. **Prompt** — `buildPrompt(useCase, context)` returns a string (isolated, no I/O).
3. **Provider** — If `copilotProvider.isAvailable()` (or wrapped `llmAdapter`): `provider.generateFromPrompt(prompt, useCase, context)`; else `deterministicFallback(useCase, context)`.
4. **Parse** — `parseCopilotOutput` + `toCopilotResponse` produce typed `CopilotResponse` with `source: "llm" | "deterministic" | "mock"`.

## Service-level use cases (real)

- `summarizeProjectStatus(projectId, tenantId [, llmAdapter])`
- `summarizeDailyReports(projectId, tenantId, dateFrom?, dateTo? [, llmAdapter])`
- `detectTopRisks(projectId, tenantId [, llmAdapter])`
- `findMissingEvidence(projectId, tenantId [, llmAdapter])`
- `identifyBlockedTasks(projectId, tenantId [, llmAdapter])`
- `generateManagerBrief(projectId, tenantId [, llmAdapter])`
- `generateExecutiveBrief(projectId, tenantId, portfolioId? [, llmAdapter])`

Options can include `copilotProvider` (preferred) or legacy `llmAdapter` (wrapped into a provider).

## What is real vs scaffold

- **Real:** Context from AI Brain; prompt builder; provider interface; use-case-specific deterministic fallback; typed request/response; all seven use cases callable.
- **Scaffold:** No live LLM wired by default; `nullCopilotProvider` and deterministic fallback used until a real `ICopilotProvider` (or `ILLMAdapter`) is supplied.

## Extension points

1. **Real LLM:** Implement `ICopilotProvider.generateFromPrompt(prompt, useCase, context)` with your API, or keep using `createAdapterCopilotProvider(llmAdapter)` for the legacy `ILLMAdapter` contract.
2. **New use cases:** Add to `CopilotUseCase`, extend `buildPrompt` and `deterministicFallback`.
3. **Config:** Use env/capability flags to decide whether to pass a provider; core logic stays provider-agnostic.
