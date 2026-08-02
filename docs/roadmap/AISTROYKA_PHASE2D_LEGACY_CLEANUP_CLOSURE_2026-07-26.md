# AISTROYKA Phase 2D — Legacy Cleanup Closure

Date: 2026-07-26  
Batch: `2D_legacy_cleanup`  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`

No migration is required for this batch.

Previously created migrations remain **NOT APPLIED**:

- `20260725143000_dequeue_tenant_job.sql`
- `20260725190000_rate_limit_try_increment.sql`

Phase 2A / 2B / 2C / `2D_legacy_lite_bypass` historical artifacts were **not edited**.  
`2D_public_abuse_controls` was **not started**.  
`apps/web/wrangler.deploy.toml` was **not modified in this batch**.  
No commit, push, deploy, or migration apply was performed.

---

## Verdict

**YES** — local legacy-cleanup contract complete.

`Safe to proceed to 2D_public_abuse_controls: YES`

Production rollout: **NOT PERFORMED**.

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

Locally controllable tails in this batch: **none remaining**.

---

## Complete non-v1 route classification

| Path | Class |
| --- | --- |
| `/api/projects/**`, `/api/ai/**` | Already closed project/AI legacy (`2D_legacy_lite_bypass`) — unchanged security |
| `/api/activation/status`, `/api/invite`, `/api/tenant/*` (6) | Intended deprecated redirect — this batch |
| `/api/webhooks/incoming` | Compatibility delegate — this batch |
| `/api/contact` | Explicitly assigned to `2D_public_abuse_controls` — **not touched** |
| `/api/analysis/process` | Out of scope (separate process path) — not touched |
| `/api/auth/callback`, `/api/auth/login` | Public/auth independent — not touched |
| `/api/health`, `/api/health/auth`, `/api/system/health`, `/api/system/metrics` | System/health independent — not touched |
| `/api/_debug/auth`, `/api/diag/supabase` | Debug independent — not touched |

---

## Redirect / delegate matrix

| Legacy | Behavior | Exact canonical target |
| --- | --- | --- |
| `GET /api/activation/status` | 307 + Deprecation/Sunset/Link | `/api/v1/activation/status` |
| `POST /api/invite` | 307 + headers (**explicit** target) | `/api/v1/tenant/invite` |
| `POST /api/tenant/accept-invite` | 307 + headers | `/api/v1/tenant/accept-invite` |
| `GET /api/tenant/invitations` | 307 + headers | `/api/v1/tenant/invitations` |
| `POST /api/tenant/invite` | 307 + headers | `/api/v1/tenant/invite` |
| `GET /api/tenant/members` | 307 + headers | `/api/v1/tenant/members` |
| `PATCH /api/tenant/profile` | 307 + headers | `/api/v1/tenant/profile` |
| `POST /api/tenant/revoke` | 307 + headers | `/api/v1/tenant/revoke` |
| `POST /api/webhooks/incoming` | **delegate once** (no redirect) + headers on response | `/api/v1/webhooks/incoming` |

Shared helper: `redirectDeprecatedApiToV1(request, canonicalPath?)` in
`apps/web/lib/api/legacy-redirect.ts`.

- Auto-map: `/api/...` → `/api/v1/...`
- Explicit map: `/api/invite` → `/api/v1/tenant/invite`
- HTTP 307; query preserved; body unread; origin unchanged; no `/api/v1/v1` loops
- Headers: `Deprecation: true`, shared `Sunset`, `Link: <canonical>; rel="successor"`

Project/AI routes continue to use `redirectLegacyApiToV1` (lite 403 + same headered 307).

---

## `/api/invite` special-target proof

Before: re-exported `@/app/api/tenant/invite/route`, so a request to `/api/invite`
would run auto path-replace and incorrectly target nonexistent `/api/v1/invite`.

After: dedicated handler calls
`redirectDeprecatedApiToV1(request, "/api/v1/tenant/invite")`.

Tests assert Location contains `/api/v1/tenant/invite` and never `/api/v1/invite`.

---

## Active callsites migrated

| File | Change |
| --- | --- |
| `components/help/HelpStartChecklist.tsx` | `/api/v1/activation/status` |
| `components/help/AIGuidePanel.tsx` | `/api/v1/activation/status` |
| `components/onboarding/FirstValueBanner.tsx` | `/api/v1/activation/status` |
| `components/onboarding/GetStartedPanel.tsx` | `/api/v1/activation/status` |
| `components/onboarding/LaunchConfidenceBanner.tsx` | `/api/v1/activation/status` |

No other active web/iOS/Android/runtime fetches to the cleanup legacy tenant/invite
paths were found. Historical docs/migrations were not rewritten.

---

## Webhook compatibility proof

- Legacy wrapper imports canonical `POST` and invokes it **exactly once**.
- Original `Request` is passed through unread (body not pre-read/cloned by the wrapper).
- No `307` / `Location` (providers may not follow redirects; signatures need the original body).
- Success and error status/body/content-type/existing headers are preserved from v1.
- Wrapper adds Deprecation, Sunset, and successor Link on the returned response.
- Next.js segment config uses literal `export const dynamic = "force-dynamic"`
  (re-exporting `dynamic` as an identifier failed `next build`).

---

## Deprecation / header contract

| Header | Value |
| --- | --- |
| `Deprecation` | `true` |
| `Sunset` | `2026-06-01` (shared `LEGACY_API_HEADERS`) |
| `Link` | `<canonical-path>; rel="successor"` |

### Honest stale Sunset-date note

Shared `Sunset: 2026-06-01` is **already in the past** relative to this batch date
(2026-07-26). No owner-approved replacement date exists in current repository truth.
This batch **preserved** the existing shared value for contract compatibility and
does **not** claim that legacy routes will be removed on an invented date.

**Owner/ops follow-up:** decide and document a future Sunset date (or remove Sunset)
via an explicit approved policy change — not part of this batch’s closure proof.

---

## Project/AI lite regression

Unchanged and green:

- route-level 403 for all field-worker profiles;
- non-lite 307 with query/dynamic path preservation;
- deprecation/successor headers;
- no legacy business side effects.

---

## Files changed

- `apps/web/lib/api/legacy-redirect.ts`
- `apps/web/lib/api/legacy-redirect.test.ts`
- `apps/web/app/api/invite/route.ts`
- `apps/web/app/api/activation/status/route.ts`
- `apps/web/app/api/tenant/accept-invite/route.ts`
- `apps/web/app/api/tenant/invitations/route.ts`
- `apps/web/app/api/tenant/invite/route.ts`
- `apps/web/app/api/tenant/members/route.ts`
- `apps/web/app/api/tenant/profile/route.ts`
- `apps/web/app/api/tenant/revoke/route.ts`
- `apps/web/app/api/webhooks/incoming/route.ts`
- `apps/web/app/api/legacy-cleanup.test.ts` (new)
- five onboarding/help activation callsite components (listed above)
- `docs/roadmap/AISTROYKA_PHASE2D_LEGACY_CLEANUP_CLOSURE_2026-07-26.md`

`deprecation-headers.ts` was audited and **not** modified (no invented Sunset date).

---

## Second-audit findings and fixes

1. `/api/invite` explicit mapping verified; no `/api/v1/invite` target.
2. Trailing-slash activation redirect maps to `/api/v1/activation/status/` without loop.
3. Contact / public-abuse routes untouched.
4. Wrangler not edited in this batch.
5. Project/AI lite matrix remained green.
6. **Build failure:** Next.js rejected `export const dynamic = v1Dynamic`. Fixed by using
   literal `export const dynamic = "force-dynamic"`. Focused webhook/cleanup tests and
   `bun run build` / `cf:build` re-run: PASS.
7. Stale Sunset documented; value left unchanged.

---

## Validation

| Gate | Result |
| --- | --- |
| Focused redirect/deprecation/cleanup/lite matrix | PASS — **4** files / **45** tests |
| Expanded focused (+ lite-allow-list, canonical webhook/projects/AI) | PASS — **8** files / **86** tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — **400** files / **2604** tests |
| `bun run build` | PASS (after webhook `dynamic` literal fix) |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | SKIPPED — fetch URL changes only; no message-key / locale copy changes |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` (batch files) | PASS |

Baseline before this batch: 399 files / 2585 tests.  
Delta: +1 file / +19 tests (400 / 2604).

---

## Explicit confirmations

- `2D_public_abuse_controls` was **not started**.
- No commit / push / deploy / migration apply.
- No production rollout claim.
- Unrelated dirty-worktree changes were **preserved**.
- Legacy-lite guards, tenant isolation, finance isolation, platform-owner gates,
  idempotency, rate limits, webhook signature verification, and AI policy were
  **not** weakened.

---

## Remaining out of batch

- `2D_public_abuse_controls` (`/api/contact` and related public abuse controls)
- Owner/ops: decide future Sunset date policy for legacy APIs
- Operator: apply previously pending migrations through the normal Supabase path

`Safe to proceed to 2D_public_abuse_controls: YES`
