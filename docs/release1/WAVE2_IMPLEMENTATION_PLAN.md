# Wave 2 — Implementation plan (project / task / report / review backbone)

**Authority:** `PHASE1_EXECUTION_WAVES.md` (Wave 2), `PHASE1_ACCEPTANCE_GATES.md` (G4/G5 precursors on API), `PHASE1_FINAL_SCOPE.md` §D (F2–F5), `WAVE1_FINAL_STATUS.md`.

## Wave 2 targets

1. **API backbone correctness** for tenant-scoped reads/writes on the operational spine: projects → tasks → reports → manager review — **without** changing upload-session semantics or domain invariants.
2. **Bearer JWT parity** on any remaining routes that call `getTenantContextFromRequest` but used cookie-only `createClient()` for Supabase queries (same defect class as Wave 1).
3. **No** Worker/Manager mobile UI, **no** new Client apps, **no** notifications/earnings/AI expansion.

## Backbone surfaces covered

| Area | Repo anchors (verified / adjusted) |
|------|-----------------------------------|
| Projects | `app/api/projects/route.ts` (already `createClientFromRequest`), `api/v1/projects/[id]/route.ts` (already correct) |
| Project-scoped lists | `api/v1/projects/[id]/reports`, `api/v1/projects/[id]/uploads` — **adjusted** this wave |
| Tasks | `api/v1/tasks/route.ts`, `api/v1/tasks/[id]/route.ts`, `api/v1/tasks/[id]/assign/route.ts` — already Bearer-safe (no code change) |
| Reports | `api/v1/reports/route.ts`, `api/v1/reports/[id]/route.ts`, approval-history — already Bearer-safe |
| Review | PATCH on `api/v1/reports/[id]` — already uses `canReviewReport` + `createClientFromRequest` |
| Analysis status | `api/v1/reports/[id]/analysis-status` — **adjusted** (Bearer-safe; lite allow-list already permits path) |

## Files expected to change

- `apps/web/app/api/v1/projects/[id]/reports/route.ts`
- `apps/web/app/api/v1/projects/[id]/uploads/route.ts`
- `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts`

## Dependency order

1. Confirm tasks/reports primary routes already use `createClientFromRequest` (audit).
2. Patch project-scoped list routes and analysis-status.
3. Run Vitest + pilot smoke.

## Risk controls

- **Surgical:** import + client factory only; fallback behavior for cookie-only browsers unchanged.
- **No-touch:** `lib/tenant/**`, `lib/supabase/**` implementations, middleware, `lite-allow-list.ts`, upload-session **core** service code paths — not modified.

## Explicitly out of Wave 2

- Gate G4/G5 **full** scripted proof chains (Wave 3+ execution).
- Mobile app screens, Maestro, deep Web Manager UX polish.
- Contract package rewrites; new migrations unless a blocker appears (none found).
