# Gold Memory Data Model

**Date:** 2026-06-17  
**Migration:** `20260617140000_ai_gold_memory.sql`

## Table: `ai_gold_memory`

Append-only internal table. Service-role only (RLS deny-all).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `tenant_id` | uuid FK | Required |
| `task_type` | text | e.g. `copilot_chat` |
| `audience` | text | `manager`, `owner`, etc. |
| `provenance` | text | `expert_review`, `manager_preference_pair`, `human_authored` |
| `source_table` | text | Origin table |
| `source_id` | uuid | Origin row |
| `input_hash` | text | SHA-256 of scrubbed input |
| `scrubbed_input_json` | jsonb | No raw fields |
| `scrubbed_gold_output_json` | jsonb | No raw fields |
| `rationale` | text nullable | Safe rationale |
| `embedding_json` | jsonb nullable | Float array (pgvector deferred) |
| `embedding_model` | text nullable | |
| `embedding_dim` | int nullable | |
| `pii_scrub_version` | text | `v1` |
| `finance_guard_passed` | boolean | Required true for owner/customer retrieval |
| `consent_snapshot` | boolean | Must be true at write |
| `is_active` | boolean | Default true |
| `created_at` / `updated_at` | timestamptz | |

## Indexes

- `(tenant_id, task_type, audience)` partial `is_active`
- `(source_table, source_id)` unique
- `(input_hash)`
- `(tenant_id, created_at desc)`

## RLS

Deny-all policy — no tenant/user read or write via JWT.

## Write rules

1. Consent snapshot true  
2. PII scrub + verifier pass  
3. Finance guard pass for owner/customer audience  
4. Idempotent upsert on `(source_table, source_id)`
