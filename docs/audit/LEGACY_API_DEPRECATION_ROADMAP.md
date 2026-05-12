# Legacy API Deprecation Roadmap

## Inspected files

- Route inventories:
  - `apps/web/app/api/**/route.ts`
  - `apps/web/app/api/v1/**/route.ts`
- Deprecation helpers:
  - `apps/web/lib/api/deprecation-headers.ts`
  - `apps/web/lib/api/deprecation-headers.test.ts`
- Consumer samples:
  - `ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift`
  - `ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift`
  - `android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt`
  - `android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt`
  - web client usage scan across `apps/web/**/*.ts(x)`

## Current route inventory

- Legacy namespace (`/api/*`): still present for compatibility, including system/health/contact/auth and selected project endpoints.
- Canonical namespace (`/api/v1/*`): broad coverage (200+ route handlers) and used by modern web/mobile clients.

## Current consumers

- **iOS Worker/Manager:** `/api/v1/*` paths (shared API client abstractions).
- **Android shared clients:** `/api/v1/*` paths.
- **Web dashboard/public:** mixed internal calls; canonical endpoints primarily `/api/v1/*`, with some legacy `/api/*` compatibility touchpoints.
- **External/unknown consumers:** possible direct calls to legacy `/api/*` endpoints (requires traffic telemetry to fully enumerate).

## Classification

- **Must keep for compatibility (short-term):**
  - `POST /api/ai/analyze-image` (legacy compatibility alias behavior already documented/tests around deprecation headers)
  - selected auth/profile compatibility endpoints still referenced by older clients/scripts
- **Can migrate now:**
  - web internal callers still targeting `/api/*` where `/api/v1/*` exists
- **Can deprecate later (after telemetry + migration window):**
  - remaining `/api/*` aliases with confirmed `/api/v1/*` parity and no mobile consumers
- **Unsafe to remove now:**
  - any legacy endpoint without verified zero consumer traffic
- **Unknown:**
  - external integrations not instrumented in current session

## Recommended migration order

1. Freeze new development to `/api/v1/*` only (policy).
2. Add/verify `Deprecation` + `Sunset` headers for all legacy `/api/*` routes.
3. Instrument legacy route usage telemetry (route + caller class/user-agent).
4. Migrate remaining web internal callers from `/api/*` to `/api/v1/*`.
5. Announce deprecation window (minimum one release cycle, ideally two).
6. Remove only routes with proven zero usage and explicit compatibility sign-off.

## Risk assessment

- **High risk:** breaking older mobile/web clients or third-party automations if legacy routes are removed prematurely.
- **Medium risk:** duplicate route maintenance burden while both stacks exist.
- **Low risk:** staged migration with telemetry and headers before removal.

## Timeline (proposed)

- **T0 (now):** keep both, ensure headers/roadmap.
- **T0 + 2 weeks:** complete telemetry and web internal migrations.
- **T0 + 4–6 weeks:** deprecate low-risk legacy aliases with zero traffic.
- **T0 + 8+ weeks:** remove remaining legacy routes only after compatibility gate review.

## Done criteria

- Legacy `/api/*` usage observable with telemetry.
- All first-party clients (web/iOS/android) confirmed on `/api/v1/*`.
- Deprecation headers active on all retained legacy routes.
- Zero-traffic evidence for each removed route.
- Release notes + operator migration guidance published.

## Commands run

- route file glob scans under `apps/web/app/api` and `apps/web/app/api/v1`
- consumer scans via ripgrep in `ios/`, `android/`, and `apps/web/`
- deprecation helper source review

## Result

Roadmap completed with migration order, compatibility classification, and removal criteria.

## Changes made

- Added this roadmap document.

## Remaining blockers

- Need live traffic telemetry to safely remove legacy `/api/*` routes.

## Final verdict

PASS
