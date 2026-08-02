# AISTROYKA Phase 2D — Legacy Lite Bypass Closure

Date: 2026-07-26  
Batch: `2D_legacy_lite_bypass`  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`

No migration is required for this batch.

Previously created migrations remain **NOT APPLIED**:

- `20260725143000_dequeue_tenant_job.sql`
- `20260725190000_rate_limit_try_increment.sql`

Phase 2A / 2B / 2C historical artifacts were **not edited**.  
`2D_legacy_cleanup` and `2D_public_abuse_controls` were **not started**.  
No commit, push, deploy, or migration apply was performed.

---

## Verdict

**YES** — local code and legacy lite-bypass contract complete.

`Safe to proceed to 2D_legacy_cleanup: YES`

Production rollout: **NOT PERFORMED**. The new behavior is local until the normal
commit/review/deploy path is explicitly requested.

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

Locally controllable tails in this batch: **none remaining**.

---

## Exact nine-route inventory

| # | Legacy route | Canonical successor | Side effects previously reachable by lite |
| --- | --- | --- | --- |
| 1 | `GET\|POST /api/projects` | `/api/v1/projects` | list + **createProject** |
| 2 | `GET /api/projects/:id` | `/api/v1/projects/:id` | project read via RPC |
| 3 | `POST /api/projects/:id/jobs/:jobId/trigger` | `/api/v1/projects/:id/jobs/:jobId/trigger` | previously 501 stub; now redirects to real v1 |
| 4 | `POST /api/projects/:id/media/:mediaId/trigger` | `/api/v1/projects/:id/media/:mediaId/trigger` | analysis job trigger RPC |
| 5 | `GET /api/projects/:id/poll-status` | `/api/v1/projects/:id/poll-status` | media/job status reads |
| 6 | `POST /api/projects/:id/upload` | `/api/v1/projects/:id/upload` | storage upload + media insert + analysis job |
| 7 | `POST /api/ai/analyze-image` | `/api/v1/ai/analyze-image` | independent AI vision provider path |
| 8 | `POST /api/ai/analyze-video-daily` | `/api/v1/ai/analyze-video-daily` | re-exported v1 AI handler |
| 9 | `POST /api/ai/transcribe` | `/api/v1/ai/transcribe` | re-exported v1 transcription handler |

---

## Architecture

### Route-level enforcement (mandatory / primary)

Shared helper `forbidLiteOnLegacyRoute` (`lib/api/legacy-lite-guard.ts`):

- parses `x-client` case-insensitively with trim;
- recognizes `ios_lite`, `android_lite`, `ios_worker`, `android_worker`;
- returns `403` with `{ error: "forbidden", code: "lite_client_path_forbidden" }`;
- runs before body parse, Supabase, storage, RPC, AI, or any other side effect.

Every legacy handler is now only:

1. lite guard via `redirectLegacyApiToV1`;
2. non-lite `307` to the equivalent `/api/v1/...` path (query + dynamic segments preserved);
3. deprecation + successor `Link` headers.

Handlers are proven safe when invoked directly as functions in unit tests (no middleware).

### Reverse re-export removed

`apps/web/app/api/v1/projects/route.ts` **no longer** re-exports from
`@/app/api/projects/route`. Canonical list/create lives under v1. Legacy root is
guard + redirect only.

### Middleware defense-in-depth (secondary)

`checkLiteAllowList` now also forbids segment-safe legacy families:

- `/api/projects` and descendants;
- `/api/ai` and descendants.

Repeated `/api/v1` middleware gates use `isSamePathOrChild` (not bare
`startsWith("/api/v1")`). Unrelated legacy paths (`/api/health`,
`/api/analysis/process`, `/api/activation/status`, `/api/tenant/*`) are **not**
classified as the protected families.

### Cloudflare Worker middleware bypass

`cf:build` still patches the Worker to bypass Next middleware for most
`/api/v1/*`. Therefore:

- a redirect to `/api/v1/*` alone is **not** treated as the sole security proof;
- legacy `/api/projects*` and `/api/ai/*` still execute middleware on CF (bypass
  is v1-only), so middleware depth helps there;
- **route-level guards remain the authoritative fail-closed layer** for all nine
  legacy handlers when invoked directly.

---

## Canonicalization / redirect matrix (non-lite)

For `web`, `ios_full`, and `android_full`:

| Legacy | Location | Status |
| --- | --- | --- |
| `/api/projects?page=1` | `/api/v1/projects?page=1` | 307 |
| `/api/projects/proj-1?view=full` | `/api/v1/projects/proj-1?view=full` | 307 |
| `/api/projects/proj-1/jobs/job-9/trigger` | `/api/v1/projects/proj-1/jobs/job-9/trigger` | 307 |
| `/api/projects/proj-1/media/media-2/trigger` | `/api/v1/projects/proj-1/media/media-2/trigger` | 307 |
| `/api/projects/proj-1/poll-status` | `/api/v1/projects/proj-1/poll-status` | 307 |
| `/api/projects/proj-1/upload` | `/api/v1/projects/proj-1/upload` | 307 |
| `/api/ai/analyze-image?trace=1` | `/api/v1/ai/analyze-image?trace=1` | 307 |
| `/api/ai/analyze-video-daily` | `/api/v1/ai/analyze-video-daily` | 307 |
| `/api/ai/transcribe` | `/api/v1/ai/transcribe` | 307 |

POST remains method-preserving via HTTP 307. Body is not consumed by the legacy
handler before redirect.

---

## Active callsites migrated

| Callsite | Change |
| --- | --- |
| `apps/web/app/[locale]/(dashboard)/projects/AiConfigHint.tsx` | UI hint path → `/api/v1/ai/analyze-image` |
| `apps/web/wrangler.deploy.toml` | `AI_ANALYSIS_URL` staging/production → `/api/v1/ai/analyze-image` |

Archive / historical docs mentioning legacy paths were **not** rewritten.
No active iOS/Android runtime fetch to these legacy families was found.

---

## Side-effect-before-guard audit

Legacy route sources import only `redirectLegacyApiToV1` (no
`createProject` / `createClient` / `getAdminClient` / `analyzeImage` /
`createAnalysisJob` / v1 re-exports). Direct-handler tests mock those modules to
throw if ever called; lite and non-lite cases complete without invoking them.

---

## Boundary classification

Must classify (lite → 403):

- `/api/projects`, `/api/projects/`, `/api/projects/p1`
- `/api/ai`, `/api/ai/`, `/api/ai/transcribe`

Must **not** classify:

- `/api/project`, `/api/projectsz`, `/api/projects-old`
- `/api/aix`, `/api/ai-tools`
- `/api/health`, `/api/analysis/process`, `/api/activation/status`, `/api/tenant/*`

---

## Phase 2C preservation

Confirmed unchanged:

- lite `GET /api/v1/projects` remains allowed;
- lite `POST /api/v1/projects` remains forbidden by the v1 allow-list;
- read-scope (devices / upload-sessions root reads; analysis-status GET-only);
- prefix-boundary segment-safe `/api/v1` prefixes;
- idempotency / rate-limit contracts not weakened.

---

## Files changed

- `apps/web/lib/api/path-segment.ts` (+ test)
- `apps/web/lib/api/legacy-lite-guard.ts` (+ test)
- `apps/web/lib/api/legacy-redirect.ts` (+ test)
- `apps/web/lib/api/lite-allow-list.ts` (+ test updates)
- `apps/web/middleware.ts`
- `apps/web/middleware.legacy-lite-bypass.test.ts` (new)
- `apps/web/app/api/projects/**` (9 handler surfaces → guarded redirects)
- `apps/web/app/api/ai/**` (3 routes → guarded redirects; tests updated)
- `apps/web/app/api/v1/projects/route.ts` (canonical implementation; no reverse re-export)
- `apps/web/app/api/v1/projects/route.test.ts` (new)
- `apps/web/app/api/legacy-lite-bypass.test.ts` (new)
- `apps/web/app/[locale]/(dashboard)/projects/AiConfigHint.tsx`
- `apps/web/wrangler.deploy.toml`
- `docs/roadmap/AISTROYKA_PHASE2D_LEGACY_LITE_BYPASS_CLOSURE_2026-07-26.md`

---

## Second-audit findings and fixes

After the first green focused run:

1. Confirmed no reverse `v1/projects → legacy` import remains.
2. Confirmed legacy route sources have no business-side-effect imports.
3. Extended legacy-family allow-list matrix with explicit `HEAD` + trailing-slash
   cases (defense-in-depth). Implementation already forbade all methods on those
   families; tests only.
4. Verified sibling-prefix false positives remain false.
5. Verified mixed-case / whitespace `x-client` on the shared guard.
6. Verified Cloudflare assumption documented: route-level remains primary because
   v1 middleware may be bypassed after redirect.
7. No redirect loops (legacy → v1 only).
8. Canonical AI + projects regression remained green.

No production-code logic failure remained after the audit.

---

## Validation

| Gate | Result |
| --- | --- |
| Focused helper/redirect/route/middleware matrix | PASS — **9** files / **66** tests |
| Focused + canonical AI regression | PASS — **11** files / **84** tests |
| `bun run --cwd apps/web test -- lib/api/lite-allow-list.test.ts` | PASS (included above) |
| `bun run lint` | PASS |
| `bun run test` | PASS — **399** files / **2585** tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` (batch files) | PASS |

Baseline before this batch: 393 files / 2552 tests.  
Delta: +6 files / +33 tests (399 / 2585).

---

## Explicit confirmations

- Route-level enforcement proven for all nine legacy routes × four field-worker profiles.
- Middleware defense-in-depth proven for legacy families + segment-safe `/api/v1`.
- Cloudflare v1 middleware bypass considered; redirect alone is not the security proof.
- `2D_legacy_cleanup` was **not started**.
- No commit / push / deploy / migration apply.
- No production rollout claim.
- Unrelated dirty-worktree changes were **preserved**.

---

## Remaining out of batch

- `2D_legacy_cleanup` (keep redirects; broader legacy deprecation cleanup / smoke)
- `2D_public_abuse_controls`
- Operator: apply previously pending migrations through the normal Supabase path
- Optional later: align accidental duplicate `wrangler (1).deploy.toml` if still present

`Safe to proceed to 2D_legacy_cleanup: YES`
