# Dangerous Branches — Do Not Broad-Merge

**Date:** 2026-06-23  
**Baseline `main`:** `d7a0547c3b571d572434466a470dce8b180d6537`

## Policy

These branches must **not** be broad-merged into `main`. Revival requires:

1. Fresh rebase onto current `main`
2. Small-slice scoped audit (issue-specific stacked audit pattern)
3. Full validation (install, lint, contracts, i18n:check, tests, build, cf:build)
4. Non-author APPROVED protected merge
5. No migrations/live deploy without explicit operator gate

## Primary forbidden branch

| Branch | Last SHA | vs `main` | Why broad merge is forbidden |
|--------|----------|-----------|------------------------------|
| `cursor/aistroyka-system-maturity-7957` | `63d9f26f` | not merged | ~584 commits stale at PR #124 intake; touches auth/sync/media/migrations; external 9.5/10 claim rejected; see `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/` |

## AI / Flywheel (broad)

| Branch | Last SHA | vs `main` | Risk |
|--------|----------|-----------|------|
| `ai/expert-review-queue-mvp` | `498b6743` | not merged | Open PR; AI runtime scope — small slice only |
| `ai/gold-memory-mvp` | `98a068c1` | not merged | Open PR; AI memory scope |
| `ai/flywheel-final-tail-closure` | `20b4f3f7` | not merged | Open PR; flywheel tail |
| `audit/issue-111-ai-flywheel-stacked-audit-2026-06-21` | `d810465b` | not merged | Audit branch; docs-only intent but stacked on old base |

**Strategy:** Issue #111 audit first; implement only isolated slices after rebase.

## Mobile pilot (broad)

| Branch | Last SHA | vs `main` | Risk |
|--------|----------|-----------|------|
| `audit/issue-112-mobile-pilot-stacked-audit-2026-06-22` | `1a862c8f` | not merged | Mobile pilot audit; iOS-primary contour — no broad Android parity |

**Strategy:** Issue #112 audit; UITest/smoke per `ios/README.md`; no speculative mobile backend expansion.

## Liquid Glass / design / public (broad)

| Branch | Last SHA | vs `main` | Risk |
|--------|----------|-----------|------|
| `design/liquid-glass-public-shell-lg2a` | `68be705a` | not merged | Open PR; broad public UI surface |

**Strategy:** Issue #113 small public/design slice only if narrowly scoped.

## Middleware / security (broad)

| Branch | Last SHA | vs `main` | Risk |
|--------|----------|-----------|------|
| `audit/issue-114-middleware-security-stacked-audit-2026-06-22` | `4475dcd1` | not merged | Middleware/security audit stacked on old base |
| `claude/aistroyka-audit-security-infra-cg810i` | `193e9b80` | not merged | Security/infra audit branch |

**Strategy:** Issue #114 remaining slices only if small and evidence-backed (PR #120 headers already merged).

## Broad release / reconciliation

| Branch | Last SHA | vs `main` | Risk |
|--------|----------|-----------|------|
| `integration/aistroyka-full-reconciliation-2026-06-20` | `bc23c832` | merged | Large reconciliation integration; historical baseline only |
| `release/web-pilot-rc` | `9d6a7812` | not merged | Broad release contour; diverged from current main |
| `release/publication-readiness-mega-sprint` | `c6617419` | not merged | Mega-sprint release; migration/API drift risk |
| `release/vercel-prod-hardening-2026-03-05` | `667212dd` | merged | Legacy prod hardening |
| `release/phase5-2-1` | `2ad42578` | merged | Legacy phase release |
| `release/cloudflare-agent-starter-split` | `17547e66` | merged | Legacy deploy split |

**Strategy:** Treat as historical evidence; do not merge wholesale. Extract only proven small slices with fresh audits.

## Small-slice revival template (if ever needed)

1. Identify single issue scope (one PR, one concern)
2. Rebase or cherry-pick onto current `main`
3. Run full validation + scoped smoke if runtime claim
4. Protected merge with non-author approval
5. Update `docs/CURRENT_PROJECT_TRUTH_INDEX.md` if status claim changes
