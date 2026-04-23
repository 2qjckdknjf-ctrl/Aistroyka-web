# ARCHIVE DECISION LOG

**Audit date:** 2026-04-02  
All moves are **git mv** (history preserved). **No deletions.**

| Old path | New path | Why archived | What replaced it | Safe to delete later? | Owner recommendation |
|----------|----------|--------------|------------------|-------------------------|----------------------|
| `docs/audit/live/` (entire directory) | `archive/v1-pre-release-cleanup/docs/audit/live/` | Dated live snapshots superseded by 2026-04 platform audit | `PLATFORM_INTEGRATION_TRUTH_MATRIX.md`, live health checks in audit | No — keep in archive | Retain ≥1 year |
| `docs/audit/DEPLOY_MISMATCH_RCA.md` | `archive/v1-pre-release-cleanup/docs/audit/DEPLOY_MISMATCH_RCA.md` | Incident narrative | Current deploy runbooks + CI | No | Keep archive |
| `docs/audit/DEPLOY_PUSH_PLAN.md` | `archive/v1-pre-release-cleanup/docs/audit/DEPLOY_PUSH_PLAN.md` | Dated plan | Same | No | Keep archive |
| `docs/audit/DEPLOY_PUSH_LOG.md` | `archive/v1-pre-release-cleanup/docs/audit/DEPLOY_PUSH_LOG.md` | Dated log | Same | No | Keep archive |
| `docs/audit/DEPLOY_WORKFLOW_NOTES.md` | `archive/v1-pre-release-cleanup/docs/audit/DEPLOY_WORKFLOW_NOTES.md` | Notes | Same | No | Keep archive |
| `docs/audit/DEPLOY_OR_ROUTE_MISMATCH_RCA.md` | `archive/v1-pre-release-cleanup/docs/audit/DEPLOY_OR_ROUTE_MISMATCH_RCA.md` | RCA | Same | No | Keep archive |
| `docs/audit/PRODUCTION_LOCKDOWN_COMPLETE_20260303185654.md` | `archive/v1-pre-release-cleanup/docs/audit/PRODUCTION_LOCKDOWN_COMPLETE_20260303185654.md` | Point-in-time report | Ongoing security docs | No | Keep archive |
| `docs/audit/PROD_HEALTH_VERIFICATION_20260303193258.txt` | `archive/v1-pre-release-cleanup/docs/audit/PROD_HEALTH_VERIFICATION_20260303193258.txt` | Text verification snapshot | `/api/health` checks in this audit | No | Keep archive |

**Items explicitly NOT archived:** `supabase-security-*` files (active reference), `docs/launch/STAGE4_*`, `docs/release-audit/*` (entire tree — deferred), SQL outside `live/` at repo root of audit.

**Related in-place edit (not a move):** `docs/audit/supabase-security-hardened-live.md` — internal references to `docs/audit/live/*` updated to `archive/v1-pre-release-cleanup/docs/audit/live/*` so links resolve after the archive move.
