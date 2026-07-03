# WEB Release Candidate — Final Report

**Date:** 2026-06-20  
**Mission:** Web reality check + production reconciliation  
**RC branch:** `release/web-pilot-rc` @ `9d6a7812` (pushed to `origin`)

---

## 1. What is currently live

| Environment | Commit | buildTime | Content |
|-------------|--------|-----------|---------|
| **Production** (`aistroyka.ai`) | `ff537c8` | 2026-06-20 14:58 | `origin/main` — pre-Liquid Glass public site |
| **Staging** | `ff537c8` | 2026-06-20 14:54 | Same as main |
| **www** | `ff537c8` | 2026-06-20 14:58 | Same as apex |

Production deploy pipeline is **healthy** and **current with main**. Owner gate verified (`/en/owner` → 403 anonymous).

---

## 2. What was missing

| Gap | Detail |
|-----|--------|
| **Liquid Glass public redesign** | 21 design commits on `release/web-pilot-rc`, not on main |
| **Dashboard/auth glass integration** | Commit `9d6a7812` not deployed |
| **Visual product parity** | Live site lacks LG markers; RC code has full pass |
| **Deployment of RC branch** | Staging + prod still serve `ff537c8` |

Not missing on main (already live): core dashboard APIs, portal routes, owner middleware, P1 design tokens, stage2.2 reconciliation on main tip.

---

## 3. Was production stale?

| Comparison | Verdict |
|------------|---------|
| vs `origin/main` | **NO** — prod = main |
| vs latest web/design work | **YES** — same class of issue as mobile TestFlight before RC rebuild |
| vs `release/web-pilot-rc` | **YES** — 23 commits behind |

---

## 4. Correct web release branch

**`release/web-pilot-rc`** — based on `origin/main`, cherry-picks LG design path from `feature/unified-product-design-certification`, excludes ai-flywheel and mobile pilot commits.

Remote: `origin/release/web-pilot-rc`  
PR link: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/new/release/web-pilot-rc

---

## 5. Fixes included

- 21 Liquid Glass / public marketing redesign commits
- Dashboard, auth, shared components glass pass (`9d6a7812`)
- Conflict cleanup: flywheel UI excluded
- Local hygiene: removed accidental untracked flywheel/export WIP from working tree

**Excluded:** Stage 2.5 billing stash, ai-flywheel, mobile certification commit, expert review queue.

---

## 6. Validation result

| Check | Result |
|-------|--------|
| `i18n:check` | PASS |
| ESLint | PASS |
| `next build` (clean tree) | PASS |
| `bun run test` | PARTIAL (2 transcribe failures, vitest zod load issues) |
| `cf:build` local | FAIL (Volta on host) — defer to CI / staging |

---

## 7. Staging deploy result

**NOT DEPLOYED** — `gh` CLI unavailable (bad CPU type); no GitHub token. Staging remains `ff537c8`.

See `WEB_STAGING_DEPLOYMENT_PROOF.md` for operator dispatch steps.

---

## 8. Production deploy result

**NOT DEPLOYED** — blocked on staging proof.

Production remains `ff537c8`. See `WEB_PRODUCTION_DEPLOYMENT_PROOF.md`.

---

## 9. Remaining P0 / P1 / P2

| ID | Item | Severity |
|----|------|----------|
| P0-1 | Deploy `release/web-pilot-rc` to staging | P0 |
| P0-2 | Verify staging buildStamp + LG on public site | P0 |
| P0-3 | Production dispatch after staging smoke PASS | P0 |
| P1-1 | Fix local `gh` / auth for operator deploys | P1 |
| P1-2 | CI Check on RC PR (cf:build gate) | P1 |
| P2-1 | `.gitignore` `exports/` false positives | P2 |
| P2-2 | Transcribe route test stability | P2 |
| P2-3 | Vitest zod import errors in 19 test files | P2 |
| P2-4 | Stage 2.5 account/billing (stash) — separate track | P2 |

---

## 10. Web ready for pilot?

Based on **deployed runtime** (not RC branch code alone):

| Surface | Pilot-ready? | Rationale |
|---------|--------------|-----------|
| **Public site** | **NO** | LG brand/design not on production |
| **Dashboard** | **PARTIAL** | Core works on main; LG product surface not deployed |
| **Admin** | **PARTIAL** | Functional; not latest visual pass |
| **Owner** | **YES** | Gate verified live; grant-gated surfaces exist |
| **Portal** | **PARTIAL** | Routes/APIs on main; full E2E not re-run this audit |
| **Web production updated** | **NO** | Still `ff537c8` |

After successful staging + production deploy of `release/web-pilot-rc`, re-run health + public LG grep + authenticated dashboard smoke before upgrading verdicts to YES.

---

## Final verdict summary

```
Public site pilot-ready:     NO
Dashboard pilot-ready:       NO  (PARTIAL functionally on main; NO on design RC)
Admin pilot-ready:           NO  (PARTIAL)
Owner pilot-ready:           YES (gate verified; full ops needs grant)
Portal pilot-ready:          NO  (PARTIAL — needs authenticated staging proof)
Web production updated:      NO
```

---

## Artifacts

| Document |
|----------|
| `docs/web/WEB_LIVE_PRODUCTION_REALITY_AUDIT.md` |
| `docs/web/WEB_BRANCH_INVENTORY.md` |
| `docs/web/WEB_FEATURE_PARITY_MATRIX.md` |
| `docs/web/WEB_DEPLOYMENT_PIPELINE_AUDIT.md` |
| `docs/web/WEB_RELEASE_BRANCH_CREATION_REPORT.md` |
| `docs/web/WEB_REPAIR_REPORT.md` |
| `docs/web/WEB_RELEASE_BRANCH_VALIDATION.md` |
| `docs/web/WEB_STAGING_DEPLOYMENT_PROOF.md` |
| `docs/web/WEB_PRODUCTION_DEPLOYMENT_PROOF.md` |
| `docs/web/WEB_RELEASE_CANDIDATE_FINAL_REPORT.md` (this file) |

---

## Immediate operator next step

```bash
gh workflow run "Deploy Cloudflare (Staging)" \
  --ref release/web-pilot-rc \
  -f ref=release/web-pilot-rc
```

Then confirm `staging.aistroyka.ai/api/v1/health` shows `sha7` starting with `9d6a781`.
