# Security Follow-Up Findings

**Date:** 2026-06-24  
**Base `main` SHA:** `260a73b335d75bf3878be16e6360372377e319c4`

Compared against issue #114 stacked audit (2026-06-22, pre–PR #120) and current code on `main`.

| Area | Status | Evidence | Risk | Recommendation |
|------|--------|----------|------|----------------|
| **API security headers** | **PASS (merged #120)** | `middleware.ts` applies `applyApiSecurityHeaders` on `/api/v1/*` pass-through, lite 403, owner API paths; `worker-bootstrap.js` wraps Worker `fetch` with same API profile (OpenNext bypass mitigation); `getApiSecurityHeaders()` omits CSP; `REQUIRED_API_SECURITY_HEADER_KEYS` enforced in tests | Low on current main | No runtime change; maintain worker-bootstrap sync with `security-headers.ts` |
| **Page security headers** | **PASS (implementation)** | `applyPageSecurityHeaders` applies full CSP + frame denial on HTML routes; HSTS production-only; `getPageSecurityHeaders()` unit-tested | Low implementation risk | Add middleware **page-path** regression tests (see safe next slice) |
| **Middleware routing — public** | **PASS** | Non-protected locale routes flow through `intlMiddleware` + page headers; `/dashboard` → `/en/dashboard` redirect preserved | Low | No change |
| **Middleware routing — protected** | **PASS** | `PROTECTED_PREFIXES` gate unauthenticated users to login with `next` param; page headers on redirect | Low | Optional test: protected redirect carries page headers |
| **Middleware routing — owner** | **PASS** | `/api/v1/owner/*` and `/owner` pages gated via `gateOwnerRequest`; API vs page header profiles respected | Low | No change without owner-gate audit |
| **Lite client allow-list** | **PASS** | `checkLiteAllowList` on `/api/v1/*`; 403 JSON with API headers | Low | No change |
| **Role/admin/stakeholder boundaries** | **UNCHANGED / not regressed** | No auth/RBAC helper changes since #120; report review/export gates from reconciliation baseline intact | Medium if broad merge attempted | Do not broad-merge security branches; route-level auth changes need separate audit |
| **Test coverage — lib** | **PASS** | `security-headers.test.ts`: page/API profiles, apply helpers, worker-bootstrap key sync (8 tests) | Low | Keep worker-bootstrap test when editing headers |
| **Test coverage — middleware API** | **PASS** | `middleware.security-headers.test.ts`: 3 API-path cases (pass-through, lite 403, owner deny); asserts no CSP | Low | Extend same file for page paths |
| **Test coverage — middleware page** | **GAP (P1)** | No middleware tests assert CSP/HSTS on HTML routes (`/en`, `/en/login`, protected redirect) | Medium regression risk on matcher/header refactors | **Recommended next slice:** test-only page header tests |
| **Smoke script** | **PASS (exists, not re-run)** | `scripts/smoke/security_headers.sh` checks page vs API profiles on live URLs; PR #120 evidence at slice time | N/A this audit | Re-run only per `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` when operator-approved |
| **SECURITY_HEADERS_POLICY.md** | **PARTIAL staleness** | Documents worker-bootstrap + middleware split; unit test list omits `middleware.security-headers.test.ts` | Low doc drift | Update policy doc in a future docs-only micro-slice if desired |
| **CURRENT_PROJECT_TRUTH_INDEX.md** | **STALE SHA** | Index still references `d4681983` / PRs through #127 only | Low | Truth-index update is separate docs slice (#116 follow-up) |
| **Stale branch: `audit/issue-114-middleware-security-stacked-audit-2026-06-22`** | **DO NOT MERGE** | Stacked on pre-baseline; superseded by this follow-up + merged #120 | High if merged | Keep for historical reference only |
| **Stale branch: `hotfix/middleware-matcher-and-headers`** | **DO NOT MERGE** | Matcher/config changes; platform-sensitive; mixed with deploy workflow | High | Cherry-pick ideas only after fresh audit |
| **Stale branch: `claude/aistroyka-audit-security-infra-cg810i`** | **DO NOT MERGE / DELETE_NEVER without backup** | Security/infra audit branch; not merged | High | Manual triage only |
| **`cursor/aistroyka-system-maturity-7957`** | **FORBIDDEN** | DO_NOT_MERGE per branch archival plan | Critical | Never broad-merge |

## P0 / P1 summary

- **P0:** None identified on current `main` for API/page header implementation after PR #120.
- **P1:** Missing middleware page-path security header regression tests; policy doc test inventory slightly stale; truth index SHA outdated (orthogonal).
