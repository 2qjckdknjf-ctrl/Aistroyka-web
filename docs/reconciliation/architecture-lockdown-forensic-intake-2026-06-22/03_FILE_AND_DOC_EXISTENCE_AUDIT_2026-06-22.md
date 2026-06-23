# File and Documentation Existence Audit

**Date:** 2026-06-22  
**Baseline:** `origin/main` @ `d9718b64`

## Claimed code files (intake checklist)

| Path | On `main` | On `origin/cursor/aistroyka-system-maturity-7957` | Notes |
|------|-----------|-----------------------------------------------------|-------|
| `apps/web/lib/api/error-types.ts` | **MISSING** | **MISSING** | Claim not substantiated in either tree |
| `apps/web/lib/domain/service-contracts.ts` | **MISSING** | **MISSING** | Claim not substantiated |
| `apps/web/lib/domain/media/media.service.ts` | **PRESENT** (965 B) | Present (refactored variant on branch) | Existence ≠ lockdown certification |
| `apps/web/.eslintrc.architecture.json` | **MISSING** | **MISSING** | No architecture ESLint config found |

### `media.service.ts` on `main` (reference)

Small service: `listMediaForProject`, `getMedia` — policy check + repository calls. Pre-baseline pattern; not proof of lockdown completion.

## Claimed documentation names (grep pattern)

Searched `docs/` on `main` for:

`ARCHITECTURE_LOCKDOWN`, `FORENSIC`, `CRITICAL_PATH`, `SERVICE_CONTRACT`, `PERSISTENCE_LOCKDOWN`, `CONTEXT_UNIFICATION`, `CENTRALIZED_ERROR`, `BOUNDARY_ENFORCEMENT`, `SHADOW_LOGIC`, `TEST_SHIELD`, `EXCEPTION_REGISTER`, `EXTENSION_PLAYBOOK`, `PRODUCTION_RELIABILITY`, `VALIDATION_EVIDENCE`

**Result:** **0 files** matching claimed lockdown doc naming convention on `main`.

## Related docs on maturity branch (not on `main`)

The stale branch `origin/cursor/aistroyka-system-maturity-7957` adds **different** architecture docs, including:

- `docs/TARGET_ARCHITECTURE_STANDARD.md`
- `docs/ARCHITECTURE_COMPLETION_FINAL.md`
- `docs/ARCHITECTURE_COMPLETION_AUDIT.md`
- `docs/DOMAIN_SERVICE_MAP.md`
- `docs/ERROR_HANDLING_ARCHITECTURE.md`
- `docs/TENANT_AUTH_ARCHITECTURE.md`
- `docs/SYSTEM_STATE_FINAL_REPORT.md` (states “Production-Ready (4.5/6 maturity)” — **not** 9.5/10)

None of these are merged to current `main`.

## Stale / duplicate documentation warnings

| Item | Warning |
|------|---------|
| `docs/audit/LEGACY_INVENTORY.md` | References archived `PRODUCTION_LOCKDOWN_COMPLETE_20260303185654.md` as **ARCHIVE_CANDIDATE** — historical snapshot, not current certification |
| `docs/status/ENTERPRISE_IMPLEMENTATION.md` | “Security lockdown” week plan — strategic doc, not lockdown certification evidence |
| Maturity branch docs vs report doc names | **Name mismatch** — report cites filenames that do not exist even on the candidate branch |

## Archive

| Artifact | Status |
|----------|--------|
| `architecture_lockdown_artifacts_20260307_1348.tar.gz` | **NOT FOUND** in workspace or repo search |

## Conclusion

Claimed lockdown **file set is predominantly absent** on current `main`. The only checklist file present (`media.service.ts`) is insufficient to support certification. Claimed doc bundle **not present** under reported names. Archive **missing**.
