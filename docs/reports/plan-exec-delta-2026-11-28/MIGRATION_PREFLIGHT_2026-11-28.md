# Migration receipts preflight — 2026-11-28

**Project:** AISTROYKA `vthfrxehrursfloevnlp`  
**History export:** `migration-history-live-2026-11-28.json` (215 remote versions via Supabase MCP `list_migrations`)  
**Verified receipts file:** `docs/ops/DB_MIGRATION_RECEIPTS_2026-10-11.json`

| Candidate | Remote version present? | Preflight verdict | Exit |
|---|---|---|---|
| `20261028130000_ai_analysis_tenant_binding.sql` | No | `CANDIDATE_NOT_PROVEN_APPLIED` | 0 |
| `20261127150000_harden_internal_review_integrity.sql` | No | `CANDIDATE_NOT_PROVEN_APPLIED` | 0 |
| `20261127151000_review_ai_analysis_atomic.sql` | No | `CANDIDATE_NOT_PROVEN_APPLIED` | 0 |
| `20261127170000_media_caption_atomic_replace.sql` | No | `CANDIDATE_NOT_PROVEN_APPLIED` | 0 |
| `20261127172000_quantity_preproject_atomic_create.sql` | No | `CANDIDATE_NOT_PROVEN_APPLIED` | 0 |

`apply_authorized` remains false in the script output by design (receipts never auto-authorize apply). Candidates are not already applied under their repo versions.

**Apply path:** local `supabase` CLI binary is unusable on this host (`bad CPU type`). Apply via Supabase MCP `apply_migration` (records MCP timestamps — document remote↔repo mapping after each apply; do not rewrite applied SQL).

**Order:** tenant binding → harden review integrity → atomic review RPC → caption atomic replace → quantity/preproject atomic.
