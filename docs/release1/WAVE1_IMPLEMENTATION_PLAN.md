# Wave 1 — Implementation plan (auth / tenant / role safety)

**Authority:** `PHASE1_EXECUTION_WAVES.md` (Wave 1), `PHASE1_ACCEPTANCE_GATES.md` (G3), `PHASE1_EXCLUDES.md`, `WAVE09_FINAL_UNLOCK.md`.

## Wave 1 targets (in scope)

1. **Bearer + cookie parity for tenant-scoped API routes**  
   Routes that call `getTenantContextFromRequest(request)` (which uses `createClientFromRequest` internally) must **not** use cookie-only `createClient()` for subsequent RLS-bound queries when the caller sends `Authorization: Bearer <access_token>`. Otherwise mobile/smoke/API clients get correct tenant context but **empty or denied** data reads.

2. **Preserve** existing middleware, `lib/tenant/**`, `lib/supabase/**` contracts, and `lite-allow-list.ts` — **no** broad rewrites.

3. **Regression:** pilot smoke (`scripts/smoke/pilot_launch.sh`), full Vitest suite, existing sync route tests.

## Explicitly out of Wave 1

- Full G3 **matrix automation** (every role × every route) — tracked for later hardening; not required to close Wave 1 per execution wave wording.
- iOS/Android app changes, new Client apps, Worker/Manager feature expansion.
- `paperclip/**`, broad `ai-brain/**`, billing pilot expansion, Stripe webhook changes.
- Middleware / lite allow-list key renames or expanded product surfaces.

## Files/modules touched (dependency order)

1. **Worker summary & days** — `GET /api/v1/workers/:userId/summary`, `GET .../days` (documented in `PHASE1_FINAL_SCOPE.md` §F as verification target).
2. **Project workers** — `GET /api/v1/projects/:id/workers` (Manager dashboard; same Bearer class).
3. **Sync trio** — `GET /api/v1/sync/bootstrap`, `GET /api/v1/sync/changes`, `POST /api/v1/sync/ack` (mobile Worker lite path; allow-listed under `/api/v1/sync/**`).
4. **Tests** — sync route tests: mock `createClientFromRequest` instead of `createClient`.

## Risk controls

- **Surgical:** single-line import + client factory swap; behavior unchanged for **cookie-only** browsers (`createClientFromRequest` falls back to `createClient()` when no Bearer header).
- **No** change to tenant resolution logic or RLS policies.

## Verification

- `npm run test` (repo root)
- `bash scripts/smoke/pilot_launch.sh` with production `BASE_URL` and `.env.local` smoke credentials
