# WEB Branch Inventory

**Date:** 2026-06-20  
**Repo:** `Aistroyka-web` (`2qjckdknjf-ctrl/Aistroyka-web`)

---

## Branch list (web-relevant)

| Branch | Tip (short) | Role |
|--------|-------------|------|
| `origin/main` | `ff537c8` | **Currently deployed** to prod + staging |
| `release/web-pilot-rc` | `9d6a7812` | **Web release candidate** — LG public + dashboard glass (pushed to origin) |
| `release/mobile-pilot-rc` | `4da00942` | Mobile RC only — 12 commits ahead of main, **not web deploy target** |
| `feature/unified-product-design-certification` | `38e0d705` | Source of LG work + RBAC audit doc + Android LG + ai-flywheel tail |
| `design/liquid-glass-public-shell-lg2a` | (subset) | Early LG public shell slice |
| `release/publication-readiness-mega-sprint` | older | Historical merge branch; no unique web work ahead of main |
| `ai/gold-memory-mvp` | `6d45608b` | Pilot Android cert + flywheel — **excluded** from web RC |
| `test/stage2-3b-account-lifecycle` | `ff537c8` | Same tip as main; WIP in stash |
| `feat/stage2-2-account-workspace` | `cb90eae1` | Account workspace (merged path on main via docs/fix commits) |

---

## Which branch is deployed?

**Production and staging:** `origin/main` @ **`ff537c8`**

Evidence:
- Health `buildStamp.sha7: ff537c8`
- GitHub Actions staging runs: latest success `2026-06-20T14:53:44Z` on `ff537c8`

---

## Web commits by branch

### `release/web-pilot-rc` (23 commits ahead of `origin/main`)

Cherry-picked from `feature/unified-product-design-certification` (design-only path):

1. `2be0c0a5` — liquid glass foundation  
2. `d358b60f` — design governance color debt  
3. `d5b27ca6` — public shell and hero  
4. `febfc32c` — LG-2B shared marketing components  
5. … (platform, mobile, copilot, about, faq, contact, ai-construction-control, features, pricing, enterprise, integrations, security, implementation, LG-4X polish, workflows, solutions)  
6. `9d6a7812` — Liquid Glass across web app surfaces (dashboard/auth/components)

**Excluded from RC:**
- `9baceb73`, `a956c8a3`, `7b5654a0` — ai-flywheel / gold memory / expert review  
- `6d45608b` — pilot Android certification (mobile scope)  
- `38e0d705` — RBAC architecture audit doc only (optional; not required for deploy)

**Diff stat vs main:** 269 files, +21413 / −2568 lines under `apps/web` + design docs/scripts.

### `feature/unified-product-design-certification`

Contains all LG commits above **plus** flywheel MVP, Android Manager LG, RBAC audit doc. Tip `38e0d705` is 3 commits ahead of web RC equivalent (`1338605b` design tip + flywheel + doc).

### `release/mobile-pilot-rc`

Mobile-only deltas (iOS Worker/Manager, Android signing, TestFlight docs). Does not replace web RC.

---

## RBAC / account / billing fixes location

| Fix area | Branch / location | In web RC? |
|----------|-------------------|------------|
| Owner gate / middleware | `main` (`ff537c8`) | Yes (base) |
| Stakeholder portal routes | `main` | Yes (base) |
| P1 design tokens / footer | `main` (merged PRs #100–#102) | Yes (base) |
| Stage 2.2 account workspace | `main` + `feat/stage2-2-account-workspace` | Partial on main |
| Stage 2.5 billing/account cutover | **`stash@{0}`** only | **NO — excluded** |

---

## Unmerged web changes (not on main / not deployed)

| Source | Description | Severity |
|--------|-------------|----------|
| `release/web-pilot-rc` | Full Liquid Glass public site + dashboard glass | **P0 product** |
| `stash@{1}` | unified-product-design WIP | P2 — review before any merge |
| `stash@{0}` | stage2/billing/account/middleware WIP (14 `apps/web` files) | **Exclude** — incomplete cutover |
| Local gitignored `exports/` WIP | Export API routes + `export.service.ts` (ignored by `.gitignore` `exports/`) | Not in any branch; pollutes local builds |

---

## Stashes touching web

```
stash@{0}: On test/stage2-3b-account-lifecycle: wip-all-before-mobile-rc
stash@{1}: On feature/unified-product-design-certification: wip-non-stage22
stash@{2}: On design/liquid-glass-public-shell-lg2a: continual-learning AGENTS.md
stash@{7}: On main: WIP: android/ios/web/docs (off clean main)
```

**Policy for web RC:** do not apply `stash@{0}` or unreviewed billing middleware changes.

---

## Deployed branch vs latest web/design work

| | Commit | Contains LG? |
|--|--------|----------------|
| **Deployed** | `ff537c8` | No |
| **Latest web/design** | `9d6a7812` (`release/web-pilot-rc`) | Yes |
| **Latest unified feature branch** | `38e0d705` | Yes + flywheel (exclude flywheel for web pilot) |
