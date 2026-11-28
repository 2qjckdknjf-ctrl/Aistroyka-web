# Hosted migration apply receipt — 2026-11-28

**Project:** AISTROYKA `vthfrxehrursfloevnlp`  
**Method:** Supabase MCP `apply_migration` (local CLI unusable: bad CPU type)  
**Preflight:** all five candidates `CANDIDATE_NOT_PROVEN_APPLIED` (exit 0) against fresh history export

| Repo source | MCP remote version | Remote name | Result |
|---|---|---|---|
| `20261028130000_ai_analysis_tenant_binding.sql` | `20261128204817` | `ai_analysis_tenant_binding_20261028130000` | SUCCESS |
| `20261127150000_harden_internal_review_integrity.sql` | `20261128204820` | `harden_internal_review_integrity_20261127150000` | SUCCESS |
| `20261127151000_review_ai_analysis_atomic.sql` | `20261128204823` | `review_ai_analysis_atomic_20261127151000` | SUCCESS |
| `20261127170000_media_caption_atomic_replace.sql` | `20261128204826` | `media_caption_atomic_replace_20261127170000` | SUCCESS |
| `20261127172000_quantity_preproject_atomic_create.sql` | `20261128204829` | `quantity_preproject_atomic_create_20261127172000` | SUCCESS |

**Object check (post-apply):** `ai_analysis.tenant_id` present; `set_ai_analysis_tenant_id()` present; `review_ai_analysis_atomic(uuid, uuid, uuid, text, text, jsonb)` present.

**Note:** MCP timestamps differ from repo filenames (known skew). Repo SQL was not rewritten. Do not replay these sources. Future preflight must treat remote versions above as applied equivalents of the listed sources.
