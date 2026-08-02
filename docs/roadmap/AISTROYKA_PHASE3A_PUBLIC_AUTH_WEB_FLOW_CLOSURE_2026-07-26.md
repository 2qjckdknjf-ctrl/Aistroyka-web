# Phase 3A — public_auth_web_flow_closure

**Date:** 2026-07-26  
**Batch:** `Phase 3A — public_auth_web_flow_closure` (first bounded Phase 3 batch)  
**Phase 3A verdict:** **YES**  
**Overall Phase 3 status:** **BLOCKED_EXTERNAL**

---

## Scope

Prove local-code public website + unauthenticated authentication-entry boundary across locales `ru|en|es|it`, representative viewports, public navigation/Cabinet entry, login/register, guest redirects from protected web surfaces, and basic responsive/accessibility behavior. Produce an evidence matrix for later authenticated batches. Do **not** close overall Phase 3.

Constraints honored: no commit, push, deploy, migration apply, account seeding, or live contact submission.

---

## Audit summary (pre-implementation)

| Area | Finding |
|---|---|
| Public routes | 24 static pages under `app/[locale]/(public)/` + dynamic `docs/[slug]`, `cases/[slug]` (no invented fixtures) |
| Auth entry | `/{locale}/login`, `/{locale}/register` |
| Middleware gates | `PROTECTED_PREFIXES`: dashboard, portal, projects, billing, admin, portfolio, subscribe; platform-admin/owner via `isPlatformAdminPagePath`; unlocalized `/dashboard` → 308 `/en/dashboard` |
| Existing Playwright | `tests/e2e`, `tests/qa`, `tests/platform-admin`; QA soft-skips / screenshot baselines not acceptable as 3A proof |
| Docs drift | `docs/qa/QA_SYSTEM_INVENTORY.md` referenced non-existent `run-qa-platform.mjs` (actual: `run-qa-platform.sh`) |
| Defect found | Login/register used `next.startsWith("/")` allowing protocol-relative open redirect (`//evil.com`); fixed to `sanitizeNextRoute` / `resolvePostAuthEntry` |
| Defect found | Public header `md:` breakpoint showed full desktop nav at 768px causing horizontal overflow; moved nav/CTAs/mobile menu to `lg:` |
| Vitest | `tests/phase3a/**/*.spec.ts` was picked up by Vitest; excluded in `vitest.config.ts` |

Matrix: [`AISTROYKA_PHASE3A_WEB_FLOW_MATRIX.csv`](./AISTROYKA_PHASE3A_WEB_FLOW_MATRIX.csv)

---

## Public / locale route results

For every locale × every static public route (including auth entry and unknown-route fallback):

- Non-5xx responses
- No framework error shell
- Homepage: locale preserved; header/footer present; Cabinet/login entry visible
- Login ↔ register preserves locale; no unexpected subscribe/checkout bounce
- Internal header/footer sibling links (en sample) resolve without 5xx

Dynamic `docs/[slug]` / `cases/[slug]`: classified in matrix as `NOT_EXECUTED_no_fixture_slug`.

---

## Guest protected-surface redirects

For all four locales, guests hitting:

`/dashboard`, `/dashboard/`, `/dashboard/projects`, `/admin`, `/portal`, `/projects`, `/billing`, `/portfolio`, `/subscribe`, `/owner`, `/platform-admin`, `/platform-admin/testing`

→ localized `/{locale}/login?next=…` with login form visible, no 5xx, no redirect loop, no protected chrome leakage.

Unlocalized `/dashboard` and `/dashboard/` → `/en/login` via 308 chain. Locale-switch after redirect still gated.

---

## Authentication-entry results

| Check | Result |
|---|---|
| Login email/password controls (4 locales) | PASS |
| Register reachable; locale preserved | PASS |
| Invalid login → stays on login + accessible error | PASS |
| Open redirect `next=//evil.com` sanitized (OAuth link + post-mock redirect) | PASS (after code fix) |
| Safe internal `next=/en/dashboard/projects` preserved | PASS |
| Unauth dashboard nav → login without loop | PASS |

---

## Responsive / accessibility

Desktop (1280), tablet portrait (768), mobile portrait (390) × home/login/pricing/contact:

- No meaningful horizontal overflow (after header `lg` fix)
- Primary heading/controls visible
- Homepage landmarks + keyboard Tab + image alt/decorative
- Login/contact labeled inputs; contact HTML5 required validation without live POST

---

## Public claims audit

Scanned homepage/pricing/features/contact across all locales for `MOCK_METRICS`, `500+`, `12K+`, unsupported accuracy/savings %, “fully ready” / “production-ready” / “pilot launch complete” style claims.

**Result:** no matches in rendered public copy for those patterns. No product-policy rewrite required in this batch.

---

## Contact boundary

- Contact page + labeled form render: PASS
- Client-side required fields: PASS
- Form targets `/api/v1/contact`: PASS (source + prior unit/contract)
- Live successful submission: **not claimed** (pending rate-limit migration + trusted-CF-IP config remain operator-blocked from Phase 2D)

---

## Focused Playwright

Command: `bun run --cwd apps/web e2e:phase3a`  
Config: `apps/web/playwright.phase3a.config.ts` (Chromium required)

| Metric | Count |
|---|---|
| Executed | 216 |
| Passed | 216 |
| Failed | 0 |
| Skipped | 0 |

---

## Full unit suite

| Metric | Count |
|---|---|
| Files | 402 |
| Tests | 2620 |
| Result | PASS |

---

## Repository gates

| Gate | Result |
|---|---|
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | PASS |
| `bun run lint` | PASS |
| `bun run test` | PASS (402 / 2620) |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS (0 vulnerabilities) |
| `git diff --check` | PASS |
| `bun run --cwd apps/web e2e:pilot` | **BLOCKED_EXTERNAL** — not invoked; `E2E_PASSWORD` (and most QA/PILOT vars) MISSING; `E2E_EMAIL` alone is insufficient |

---

## Credential preflight (PRESENT / MISSING only)

| Variable | Status |
|---|---|
| QA_OWNER_EMAIL | MISSING |
| QA_OWNER_PASSWORD | MISSING |
| QA_MANAGER_EMAIL | MISSING |
| QA_MANAGER_PASSWORD | MISSING |
| QA_WORKER_EMAIL | MISSING |
| QA_WORKER_PASSWORD | MISSING |
| QA_CLIENT_EMAIL | MISSING |
| QA_CLIENT_PASSWORD | MISSING |
| QA_PLATFORM_OWNER_EMAIL | MISSING |
| QA_PLATFORM_OWNER_PASSWORD | MISSING |
| E2E_EMAIL | PRESENT |
| E2E_PASSWORD | MISSING |
| E2E_USER_EMAIL | MISSING |
| E2E_USER_PASSWORD | MISSING |
| PILOT_E2E_BASE_URL | MISSING |
| PILOT_E2E_EMAIL | MISSING |
| PILOT_E2E_PASSWORD | MISSING |
| E2E_PROJECT_ID | MISSING |

Overall Phase 3 therefore remains **BLOCKED_EXTERNAL** even though Phase 3A is YES.

---

## Files changed

### Product / auth / public UX
- `apps/web/app/[locale]/(auth)/login/page.tsx` — post-login redirect via `resolvePostAuthEntry`
- `apps/web/app/[locale]/(auth)/register/page.tsx` — post-signup via `sanitizeNextRoute`
- `apps/web/components/auth/AuthProviderButtons.tsx` — OAuth/Telegram next via `sanitizeNextRoute`
- `apps/web/components/public/PublicHeader.tsx` — desktop nav breakpoint `md` → `lg` (tablet overflow)
- `apps/web/app/[locale]/(public)/layout.tsx` — `overflow-x-clip` on ambient shell

### Tests / tooling
- `apps/web/playwright.phase3a.config.ts` (new)
- `apps/web/tests/phase3a/**` (new credential-free suite)
- `apps/web/package.json` — `e2e:phase3a` script
- `apps/web/vitest.config.ts` — exclude `tests/phase3a`

### Docs
- `docs/roadmap/AISTROYKA_PHASE3A_PUBLIC_AUTH_WEB_FLOW_CLOSURE_2026-07-26.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE3A_WEB_FLOW_MATRIX.csv`
- `docs/qa/QA_SYSTEM_INVENTORY.md` — orchestrator path + Phase 3A command note

---

## Local defects fixed

1. Open redirect on login/register/OAuth next (`//evil.com` protocol-relative).
2. Tablet (~768px) horizontal overflow from public header desktop nav.
3. Vitest incorrectly loading Playwright Phase 3A specs.
4. QA inventory docs drift (`run-qa-platform.mjs` → `.sh`).

## Remaining local defects (Phase 3A scope)

None known.

## External blockers

1. Multi-role QA/E2E credentials mostly MISSING → overall Phase 3 **BLOCKED_EXTERNAL**.
2. Pending migration `20260725190000_rate_limit_try_increment.sql` (+ trusted CF IP config) → live contact success still operator-blocked (not a 3A FAIL).
3. Stale shared Sunset date remains owner-policy follow-up (unchanged).

---

## Exact next Phase 3 batch

**`3B_authenticated_dashboard_admin_flows`**

Do not start 3C–3E until 3B is scoped with available tenant credentials.

Recommended later sequence (unchanged):

1. `3B_authenticated_dashboard_admin_flows`
2. `3C_client_portal_web_flow`
3. `3D_platform_admin_operations_center_flow`
4. `3E_multi_role_e2e_closure`

---

## Confirmation

No commit, push, deploy, migration apply, account creation, invitation, billing side effect, or live `contact_leads` mutation was performed in this batch.
