# Gold Memory Prompt Injection Smoke

**Date:** 2026-06-17

## Flag combinations (unit + integration tests)

| # | Flags | Expected | Verified |
|---|-------|----------|----------|
| 1 | all false | prompt unchanged, `gold_memory_used=false` | **YES** (`gold-memory.prompt.test.ts`) |
| 2 | read true, injection false | prompt unchanged | **YES** (injection requires read + injection) |
| 3 | read + injection true + examples | sanitized section appended, max 3, char cap | **YES** (format tests) |

## Safety checks (tests)

| Check | Result |
|-------|--------|
| Sanitized JSON only in section | **YES** |
| No raw email/PII in formatted output | **YES** |
| Owner finance examples excluded by guard | **YES** (`gold-memory.guard.test.ts`) |
| Retrieval failure → prompt unchanged | **YES** (`enrichCopilotStreamContextWithGoldMemory` catch path) |
| Copilot stream default (flags false) | **YES** (no injection code path active) |

## Live injection with real rows

**DATA_SUPPLY_EMPTY** — no production gold rows. No fake production injection.

## Controlled fixtures

Repo fixture dry-run + prompt format tests used — not injected into live Copilot.
