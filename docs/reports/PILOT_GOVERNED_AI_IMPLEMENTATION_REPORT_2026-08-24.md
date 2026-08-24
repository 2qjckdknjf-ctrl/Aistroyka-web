# Pilot Governed AI — Implementation Report — 2026-08-24 (updated)

**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Merge-base with main:** `587ef4c9821458510217fd83d734956675c2d03a` (post-merge)  
**Verdict:** **READY_FOR_STAGING_APPLY** (local/CI gates; remote migration + live staging E2E remain owner-gated)

## P0 fixes in this continuation

| Risk | Fix | Verification level |
|------|-----|-------------------|
| `owner_visible` not wired | `owner-evidence-visibility.service.ts` on manager PATCH approve/reject | PASS_UNIT |
| Public URLs in owner portal | `portal-media-projection.service.ts` via `createSignedUrlForPath` / `resolveAIMediaImage` | PASS_UNIT |
| Tenant isolation partial | Route tests + migration contract + visibility tests | PASS_UNIT / PASS_LOCAL_INTEGRATION |
| Migration gaps | `internal_only`, project consistency trigger, audit insert policy, completeness write policy | PASS_LOCAL_INTEGRATION |

## Migration

| Field | Value |
|-------|-------|
| File | `20260824120000_pilot_governed_ai_evidence.sql` |
| SHA-256 | `82f71ae9a916efa82deb58115626a0d7a63ff75fa6ccb344ff8ad8a5d568ee9a` |
| Type | Additive |
| Remote | **NOT APPLIED** |
| Manifest | `docs/reports/STAGING_MIGRATION_APPLY_MANIFEST_PILOT_GOVERNED_AI_2026-08-24.md` |

## Verification matrix

| Gate | Level | Command | Result |
|------|-------|---------|--------|
| i18n | PASS_UNIT | `bun run i18n:check` | PASS |
| lint | PASS_UNIT | `bun run lint` | PASS |
| unit/integration | PASS_UNIT | `bun run test` | PASS (1832/1832) |
| cf:build | PASS_CI | `bun run cf:build` | PASS |
| visibility lifecycle | PASS_UNIT | `owner-evidence-visibility.service.test.ts` | PASS |
| signed media projection | PASS_UNIT | `portal-media-projection.service.test.ts` | PASS |
| migration contract | PASS_LOCAL_INTEGRATION | `pilot-governed-ai-migration.contract.test.ts` | PASS |
| portal route isolation | PASS_UNIT | `visual-progress/route.test.ts` | PASS |
| Android shared contracts | PASS_UNIT | `./gradlew :shared:testDebugUnitTest` | PASS (SDK via copied local.properties) |
| iOS simulator build | NOT_VERIFIED_LIVE | Xcode not run in this slice | BLOCKED |
| Live RLS Postgres | NOT_VERIFIED_LIVE | No local Supabase stack | BLOCKED_STAGING |
| Staging E2E | NOT_VERIFIED_LIVE | Migration not applied remote | BLOCKED_STAGING |

## Residual risks (real)

1. **Public `media` bucket** may still be public at storage layer — app no longer emits permanent public URLs to owner/stakeholder portal APIs; bucket privatization on staging not verified live.
2. **Remote migration not applied** — new tables/policies inactive until owner staging apply.
3. **Historical backfill** defaults to reveal-nothing (`scripts/pilot/owner-evidence-backfill-manifest.mjs --dry-run`).

## Staging apply readiness

**READY_FOR_STAGING_APPLY** when owner sets `STAGING_MIGRATION_APPLY=YES` and runs manifest preflight.

**Not pilot-ready** until staging smoke (14 steps in manifest) executed on live DB.

## Closure verdict

**PARTIAL YES locally → READY_FOR_STAGING_APPLY** — code/tests/docs/CI-ready; live proof pending owner migration + staging smoke.
