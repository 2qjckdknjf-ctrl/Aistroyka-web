# AISTROYKA Phase 2D — Public Abuse Controls Closure

Date: 2026-07-26  
Batch: `2D_public_abuse_controls`  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`

No migration apply, commit, push, or deploy was performed in this batch.

Pending migration remains **NOT APPLIED**:

- `20260725190000_rate_limit_try_increment.sql`  
  (also still pending: `20260725143000_dequeue_tenant_job.sql`)

Shared Sunset date `2026-06-01` remains stale and is an **owner-policy follow-up**
(not changed in this batch).

Historical Phase 2A/2B/2C/2D closure artifacts were **not edited**.

---

## Verdict

**YES** — local code and public contact abuse-control contract complete.

`Safe to close Phase 2D and proceed to the next roadmap phase: YES`

Local code/contract: **YES**  
Production enablement: **BLOCKED** until operators apply
`20260725190000_rate_limit_try_increment.sql`  
Live PostgreSQL concurrency proof: **BLOCKED** (no local Supabase config/docker for
transaction-level proof; mocked RPC / algorithm twin tests are not live-DB proof)  
Configuration changes: **NOT DEPLOYED**

Overall Phase 2D (all batches): **locally complete**  
Overall release: **NO-GO** until migration apply + normal review/deploy path

Locally controllable tails in this batch: **none remaining**.

---

## Pre-change facts (audit)

### Contact topology (before)

| Route | Behavior |
| --- | --- |
| `POST /api/contact` | Independent duplicate: validate → `getAdminClient` → `insertContactLead` |
| `POST /api/v1/contact` | Independent duplicate: same logic as legacy |
| Form callsite | `ContactForm.tsx` fetched `/api/contact` |
| Rate limit | **None** |
| Trusted IP | **Not used** |
| Body size | Unbounded `request.json()` |

### HELP (before / after — unchanged)

Authenticated write routes (not public):

- `POST /api/v1/help/assistant`
- `POST /api/v1/help/hints`
- `POST /api/v1/help/assistant/events`

Existing contract (preserved):

`auth → completed idempotency peek → strict multi-bucket rate limit → strict idempotency claim → handler → finalize`

- Anonymous requests fail before business side effects (401/403).
- Tenant + user buckets always; trusted CF IP optional when present.
- Uses `checkRateLimitStrict` / `checkAndIncrementMultiStrict` (not the racy
  `checkRateLimit` SELECT/update path).
- Subscription lookup failure remains fail-closed (`503 rate_limit_unavailable`).

These HELP routes are **not** described as public.

### Cloudflare trust flag (before)

| File | `AISTROYKA_TRUST_CF_CONNECTING_IP=1` |
| --- | --- |
| `wrangler.toml` (dev/staging/production) | Present |
| `wrangler.deploy.toml` | **Missing** |

---

## Canonical / legacy contact matrix (after)

| Route | Role | Behavior |
| --- | --- | --- |
| `POST /api/v1/contact` | **Canonical owner** | size guard → admin → trusted IP → atomic IP RL → bounded body/schema → one insert |
| `POST /api/contact` | Compatibility only | `307` → `/api/v1/contact` + Deprecation/Sunset/Link; no Supabase/limiter/insert |
| `ContactForm` | First-party UI | Fetches `/api/v1/contact` |

---

## Exact public rate-limit contract

| Item | Value |
| --- | --- |
| Module | `lib/platform/rate-limit/public-contact-rate-limit.ts` |
| Endpoint key identity | `/api/v1/contact` |
| Storage key | `rateLimitKey("ip", <canonicalTrustedIp>, "/api/v1/contact")` |
| Limit | **5** requests per UTC minute window |
| Window | Shared `currentRateLimitWindow()` (minute truncation) |
| RPC | `rate_limit_try_increment` via `checkAndIncrementStrict` |
| Retry-After | **60** seconds |
| Limited code | `rate_limit_exceeded` |
| Unavailable code | `rate_limit_unavailable` |
| Plan lookup | None (anonymous) |
| PII in keys/logs | None (IP + endpoint only) |

---

## Trusted-ingress and fail-closed proof

- IP source: `resolveTrustedClientIp` → `cf-connecting-ip` **only** when
  `AISTROYKA_TRUST_CF_CONNECTING_IP=1`.
- `x-forwarded-for` / `x-real-ip` are never trusted.
- Missing trust flag, missing header, or invalid IP → **503**
  `rate_limit_unavailable`, **no insert**, **no RPC charge attempt** when IP
  unresolved (RPC not called).
- RPC error / malformed / ambiguous payload → **503**, no insert.
- Over limit → **429** + `Retry-After: 60`, no insert.
- No `"unknown"` shared IP bucket.

`wrangler.toml` and `wrangler.deploy.toml` now both set the trust flag on
Cloudflare Worker `env.dev` / `env.staging` / `env.production` vars only.
Contract test:
`lib/platform/rate-limit/cf-connecting-ip-config.contract.test.ts`.

Not enabled for Vercel/local/generic direct runtimes via this change.

---

## Body-size and side-effect-order proof

| Constant | Value |
| --- | --- |
| `CONTACT_MAX_BODY_BYTES` | `16384` |
| Oversized code | `payload_too_large` (413) |

Order:

1. Declared `Content-Length` size guard (413 before admin/RPC when oversized)
2. `getAdminClient()` required (500 if missing)
3. Trusted IP resolve (503 if absent)
4. Atomic rate-limit decision
5. Bounded `request.text()` + length check + JSON/schema validation
6. Exactly one `contact_leads` insert

Malformed JSON/schema after an allowed charge returns 400 and does **not** insert
(intentionally charges requests that passed the size guard).

Chunked/absent Content-Length oversized bodies are rejected after the allow
decision via actual byte-length check (413, no insert).

---

## HELP audit result

| Check | Result |
| --- | --- |
| Anonymous HELP writes blocked before side effects | PASS (existing auth tests) |
| Authenticated HELP uses strict multi-bucket RL | PASS |
| Subscription/plan failure fail-closed | PASS (existing service + HELP tests) |
| Trusted IP optional; tenant/user mandatory | PASS |
| No legacy racy limiter introduced on HELP | PASS |
| HELP not treated as public in this batch | Confirmed |

No HELP contract rewrite was required.

---

## Files changed

- `apps/web/app/api/v1/contact/route.ts` (+ comprehensive tests)
- `apps/web/app/api/contact/route.ts` (+ redirect tests)
- `apps/web/lib/platform/rate-limit/public-contact-rate-limit.ts` (+ tests)
- `apps/web/lib/platform/rate-limit/cf-connecting-ip-config.contract.test.ts` (new)
- `apps/web/lib/platform/rate-limit/rate-limit.store.migration.contract.test.ts` (clarify single-key module)
- `apps/web/app/[locale]/(public)/contact/ContactForm.tsx`
- `apps/web/wrangler.deploy.toml` (add Worker trust flag; typo-safe `[[env.dev.services]]`)
- `docs/roadmap/AISTROYKA_PHASE2D_PUBLIC_ABUSE_CONTROLS_CLOSURE_2026-07-26.md`

---

## Validation

| Gate | Result |
| --- | --- |
| Focused contact + HELP + config | PASS — **6** files / **52** tests |
| Expanded focused (+ rate-limit service + migration contract) | PASS — **8** files / **76** tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — **402** files / **2620** tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | SKIPPED — fetch URL only; no message-key / locale copy changes |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` (batch files) | PASS |

Baseline before this batch: 400 files / 2604 tests.  
Delta: +2 files / +16 tests (402 / 2620).

---

## Honest blockers / non-claims

1. **Migration not applied** — atomic `rate_limit_try_increment` RPC is required in
   the live DB for production contact limiting to function; until applied, CF
   Workers with trust flag will fail closed on RPC absence (`503`), which is
   safer than unlimited inserts but means contact may be unavailable in prod
   until operators apply the migration.
2. **No live Postgres concurrency proof** in this environment.
3. **Config not deployed** — wrangler.deploy.toml trust flag is local only until
   the normal deploy path.
4. **Sunset date** remains stale (`2026-06-01`) — owner/ops policy follow-up.
5. No CAPTCHA / paid service added.

---

## Explicit confirmations

- No commit / push / deploy / migration apply.
- No production mutation.
- Unrelated dirty-worktree changes preserved.
- Auth, HELP strict RL, idempotency, RLS, and service-role boundaries not weakened.
- No local/Vercel IP-trust fallback invented.

---

## Remaining out of batch / next phase

- Operator: apply `20260725190000_rate_limit_try_increment.sql` (and related pending migrations) via normal Supabase ops
- Owner: Sunset-date policy for legacy APIs
- Normal review → merge → staging → production deploy path
- Next roadmap phase after Phase 2D (per mega-roadmap / 100% plan)

`Safe to close Phase 2D and proceed to the next roadmap phase: YES`
