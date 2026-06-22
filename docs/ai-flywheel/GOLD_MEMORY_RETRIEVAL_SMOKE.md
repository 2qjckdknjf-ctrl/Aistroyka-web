# Gold Memory Retrieval Smoke

**Date:** 2026-06-17

## Live production gold rows

**Count: 0** (DATA_SUPPLY_EMPTY after infra cleanup)

## Live retrieval via app client

Attempted with local `SUPABASE_SERVICE_ROLE_KEY` — **Invalid API key** (local env not aligned with live project). Not a product defect.

## Proven via unit tests (`gold-memory.retriever.test.ts`)

| Scenario | Result |
|----------|--------|
| Read flag false → `[]` | **PASS** |
| Tenant filter applied | **PASS** |
| Owner audience excludes `finance_guard_passed=false` | **PASS** |
| Retrieval failure → `[]` | **PASS** |

## Infrastructure SQL proof

Service-role can read/write table via MCP; RLS deny-all prevents tenant access.

## Classification

**DATA_SUPPLY_EMPTY** for end-to-end live retrieval with real gold examples.

Retrieval **logic** verified via tests; live E2E deferred until data supply exists.
