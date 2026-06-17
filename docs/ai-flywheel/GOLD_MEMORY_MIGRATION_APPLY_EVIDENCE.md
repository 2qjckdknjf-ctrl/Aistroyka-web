# Gold Memory Migration Apply Evidence

**Date:** 2026-06-17  
**Target:** Supabase AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1)  
**Repo migration:** `apps/web/supabase/migrations/20260617140000_ai_gold_memory.sql`

## Status

| Check | Result |
|-------|--------|
| Local migration file present | **YES** |
| Remote applied before tail closure | **NO** (was missing) |
| Applied via Supabase MCP `apply_migration` | **YES** |
| Remote migration record | `20260617135436` / `ai_gold_memory` |

## Schema verification (post-apply)

| Check | Result |
|-------|--------|
| `ai_gold_memory` table exists | **YES** |
| All 20 expected columns | **YES** |
| `embedding_json` jsonb column | **YES** |
| RLS enabled | **YES** |
| Policy `ai_gold_memory_deny_all` (`using false`, `with check false`) | **YES** |
| Unique `(source_table, source_id)` | **YES** |
| Indexes: tenant/task/audience, input_hash, tenant_created, pkey | **YES** |

## Access verification

| Actor | Test | Result |
|-------|------|--------|
| Service-role (MCP) | INSERT infra row | **SUCCESS** |
| Service-role (MCP) | Duplicate INSERT same source | **BLOCKED** (unique violation) |
| Service-role (MCP) | DELETE infra row (cleanup) | **SUCCESS** |
| Tenant JWT / anon | SELECT | **Expected 0 rows** (deny-all RLS; not bypassed) |

## Infra smoke row

One `migration_verify_smoke` row inserted/deleted during verification only — **not production gold data**. Table left **empty** after cleanup.

## Blocker

None.
