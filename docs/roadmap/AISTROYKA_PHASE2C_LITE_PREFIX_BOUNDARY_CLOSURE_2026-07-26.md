# AISTROYKA Phase 2C — Lite Prefix Boundary Closure

Date: 2026-07-26  
Batch: `2C_lite_prefix_boundary`  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`

No migration is required for this batch.

Previously created migrations remain **NOT APPLIED**:

- `20260725143000_dequeue_tenant_job.sql`
- `20260725190000_rate_limit_try_increment.sql`

Phase 2A / 2B historical artifacts were **not edited**.  
Phase 2D was **not started**.  
No commit, push, deploy, or migration apply was performed.

---

## Verdict

**YES** — local code and allow-list prefix-boundary contract complete.

`Safe to proceed to Phase 2D: YES`

Production rollout: **NOT PERFORMED**. The new behavior is local until the normal
commit/review/deploy path is explicitly requested.

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

Locally controllable tails in this batch: **none remaining**.

---

## Exact boundary semantics

Helper: `isSamePathOrChild(pathname, basePath)` returns true only when:

- `pathname === basePath`; or
- `pathname.startsWith(basePath + "/")`.

Applied to:

| Base | Effect |
| --- | --- |
| `/api/v1/worker` | Exact worker surface and descendants only |
| `/api/v1/sync` | Exact sync surface and descendants only |
| `/api/v1/media/upload-sessions` | Exact upload-session surface and descendants only |
| `/api/v1/devices` | Exact devices surface and descendants only |
| `/api/v1/auth` | Exact auth surface and descendants only |
| `/api/v1` (outer classification) | Only real `/api/v1` paths are classified; `/api/v1x` and `/api/v10` are not |

Sibling strings that share a textual prefix but not a path segment (for example
`/api/v1/worker-evil`, `/api/v1/workers`, `/api/v1/authz`) no longer match.

---

## Positive path matrix (remain allowed for lite/worker)

| Path | Method | Profiles |
| --- | --- | --- |
| `/api/v1/worker` | any allowed by prior contract | `ios_lite`, `android_lite`, `ios_worker`, `android_worker` |
| `/api/v1/worker/tasks/today`, `/api/v1/worker/report/*`, other real worker descendants | as before | same |
| `/api/v1/sync/bootstrap`, `/api/v1/sync/changes`, `/api/v1/sync/ack` | as before | same |
| `/api/v1/media/upload-sessions` | `POST` create | same |
| `/api/v1/media/upload-sessions/:id/finalize` | `POST` | same |
| `/api/v1/devices/register`, `/api/v1/devices/unregister` | writes | same |
| `/api/v1/auth/login`, `/api/v1/auth/methods`, `/api/v1/auth/telegram` | as before | same |
| `/api/v1/projects` | `GET` | same |
| `/api/v1/config` | any | same |
| `/api/v1/tasks/:id` | `GET` | same |
| `/api/v1/reports/:id` | `GET` | same |
| `/api/v1/reports/:id/analysis-status` | `GET` only | same |
| `/api/v1/activation/status` | `GET` | same |
| `/api/v1/help/hints`, `/api/v1/help/assistant`, `/api/v1/help/assistant/events` | `POST` | same |

Trailing slash on legitimate child surfaces remains allowed where it already was
a descendant of a segment-safe base (for example `/api/v1/worker/`).

---

## Negative sibling-prefix matrix (must 403)

For every field-worker profile (`ios_lite`, `android_lite`, `ios_worker`,
`android_worker`), each path below returns status `403` and code
`lite_client_path_forbidden`:

- `/api/v1/worker-evil`
- `/api/v1/worker2`
- `/api/v1/workers` (real manager workers inventory sibling)
- `/api/v1/workers-admin`
- `/api/v1/sync-evil`
- `/api/v1/sync2`
- `/api/v1/media/upload-sessions-old`
- `/api/v1/media/upload-sessions2`
- `/api/v1/devices-admin`
- `/api/v1/devices2`
- `/api/v1/authz`
- `/api/v1/auth-evil`

Also proven:

- web / `ios_full` / `android_full` remain unaffected (null / no lite 403);
- `/api/v1x/...` and `/api/v10/...` are not classified as `/api/v1`;
- trailing slash does not reopen manager-only root reads for devices or
  upload-sessions;
- `HEAD` does not reopen those root reads.

---

## Read-scope preservation (from `2C_lite_read_scope`)

Confirmed unchanged by this batch:

- lite `GET`/`HEAD` for root `/api/v1/devices` (and trailing slash) stays forbidden;
- lite `GET`/`HEAD` for root `/api/v1/media/upload-sessions` (and trailing slash) stays forbidden;
- upload-session `POST` create remains allowed;
- upload-session finalize remains allowed;
- device register/unregister remains allowed;
- `analysis-status` remains GET-only;
- methods were not broadened.

---

## Files changed

Allowed batch files only:

- `apps/web/lib/api/lite-allow-list.ts`
- `apps/web/lib/api/lite-allow-list.test.ts`
- `docs/roadmap/AISTROYKA_PHASE2C_LITE_PREFIX_BOUNDARY_CLOSURE_2026-07-26.md`

No route handlers, middleware, tenant context, idempotency, rate-limit, mobile
client, or migration files were modified in this batch.

---

## Second-audit findings and fixes

After the first green focused run, an independent bypass audit checked:

- sibling-prefix bypasses;
- trailing slash;
- `HEAD`;
- root-versus-child behavior;
- `/api/v1` versus `/api/v10` and `/api/v1x`;
- accidental weakening of completed read-scope rules;
- accidental method broadening.

Finding:

1. Real route family `/api/v1/workers` (and `/api/v1/workers/[userId]/…`) is a
   textual sibling of `/api/v1/worker`. Under the old `startsWith("/api/v1/worker")`
   rule it would have been incorrectly allowed for lite clients. Segment-safe
   matching already forbids it; the negative matrix was extended to include
   `/api/v1/workers` explicitly. Focused + expanded lite regression re-run: PASS.

No code logic change was required after the first implementation; no locally
controllable production-code tail remained.

Note (out of batch, not started): middleware still uses
`pathname.startsWith("/api/v1")` when deciding whether to invoke
`checkLiteAllowList`. The allow-list's own outer classification is segment-safe,
so `/api/v1x` / `/api/v10` return null from the helper. Middleware refactor is
explicitly out of scope for this batch.

---

## Validation

| Gate | Result |
| --- | --- |
| Focused `lite-allow-list.test.ts` | PASS — 1 file / **22** tests |
| Expanded lite regression (`lite-allow-list` + `lite-idempotency` + `client-profile`) | PASS — 3 files / **44** tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — **393** files / **2552** tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` (batch files) | PASS |

Baseline before this batch: 393 files / 2547 tests.  
Delta: +5 tests from the prefix-boundary matrix (2552 − 2547).

Existing Next.js hook/image warnings were non-blocking and are unrelated to this
batch.

---

## Explicit confirmations

- Read-scope behavior from `2C_lite_read_scope` was **preserved**.
- Phase 2D was **not started**.
- No commit / push / deploy / migration apply.
- No production rollout claim.
- Unrelated dirty-worktree changes were **preserved**.

---

## Remaining out of batch

- Phase 2D: `2D_legacy_lite_bypass` (legacy `/api/projects*`, `/api/ai/*` lite middleware bypass)
- Operator: apply the previously pending migrations through the normal Supabase
  operations path
- Optional later hardening (not this batch): make middleware's `/api/v1` entry
  gate segment-safe to match the allow-list helper

`Safe to proceed to Phase 2D: YES`
