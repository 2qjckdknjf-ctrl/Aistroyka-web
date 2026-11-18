# WEB Live Production Reality Audit

**Date:** 2026-06-20  
**Auditor:** automated reality check (runtime-first, docs not trusted)  
**Scope:** `https://aistroyka.ai`, `https://www.aistroyka.ai`, key routes and health

---

## Executive answers

| Question | Answer |
|----------|--------|
| **What commit is live?** | `ff537c8` (`ff537c8d` — *chore: reconcile Supabase migration timestamps*) |
| **Is production on latest expected branch?** | **Yes for `origin/main`** — production tracks main exactly. **No for design/product RC** — Liquid Glass and public redesign are not on main. |
| **Is production behind current repo work?** | **Behind unmerged design work** (`release/web-pilot-rc` / `feature/unified-product-design-certification`). **Not behind main.** |
| **Does public site show latest brand/design?** | **NO** — live HTML lacks Liquid Glass markers (`PublicLiquidGlass`, `AppGlassRoot`, `liquid-glass` CSS hooks). Pre-LG public shell. |
| **Does dashboard show latest product surface?** | **NO** — dashboard glass integration and LG component pass exist only on `release/web-pilot-rc`, not deployed. |

---

## Runtime evidence

### Health / build stamp

| Host | URL | `buildStamp.sha7` | `buildTime` | `env` |
|------|-----|-------------------|-------------|-------|
| Production apex | `GET https://aistroyka.ai/api/v1/health` | `ff537c8` | `2026-06-20 14:58` | `production` |
| Production www | `GET https://www.aistroyka.ai/api/v1/health` | `ff537c8` | `2026-06-20 14:58` | `production` |
| Staging | `GET https://staging.aistroyka.ai/api/v1/health` | `ff537c8` | `2026-06-20 14:54` | `staging` |

Full production health JSON (2026-06-20):

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"production","buildStamp":{"sha7":"ff537c8","buildTime":"2026-06-20 14:58"}}
```

**Git match:** `ff537c8` = current `origin/main` tip (`git rev-parse --short origin/main`).

### Route behavior (unauthenticated)

| Route | HTTP | Notes |
|-------|------|-------|
| `/en/login` | 200 | Auth page reachable |
| `/en/owner` | **403** | Owner gate active (expected without grant) |
| `/en/dashboard` | 200 (after redirect chain) | Protected shell redirects unauthenticated users toward login |
| `/en/portal/projects` | 200 (after redirect chain) | Stakeholder portal behind auth middleware |

### Public landing / design markers

- Grep of live `/en` HTML for `PublicLiquidGlass`, `AppGlassRoot`, `liquid-glass`, `PublicGlassShell`: **no matches** (2026-06-20).
- Local `release/web-pilot-rc` codebase **does** contain LG components (`AppGlassRoot`, `PublicLiquidGlassRoot`, public glass shells).

### API auth envelope

- `/api/v1/health` — public, no auth required; returns build stamp (verified).
- `/api/v1/owner/*` — owner gate in middleware (403 without grant; verified via `/en/owner` page gate).
- Lite client allow-list active in middleware for `x-client: ios_lite|android_lite`.

---

## What is live vs what is in repo

| Layer | Live (`ff537c8`) | Latest design RC (`9d6a7812`) |
|-------|------------------|-------------------------------|
| Public Liquid Glass redesign | Absent | Present (21 commits on `release/web-pilot-rc`) |
| Dashboard/auth glass surfaces | Partial (P0 tokens on main) | Full LG pass (`1338605b` equivalent) |
| AI flywheel / expert review | Not on main | **Excluded** from web RC intentionally |
| Stage 2.5 billing/account cutover | Stash only (`stash@{0}`) | **Excluded** |
| Android/iOS pilot certification | Separate `release/mobile-pilot-rc` | **Excluded** from web RC |

---

## Verdict

Production is **fresh relative to `main`** but **stale relative to completed Liquid Glass / public marketing work** sitting on feature branches. This mirrors the mobile TestFlight situation: correct improvements existed in branches; runtime did not include them.

**Next action:** deploy `release/web-pilot-rc` to staging, verify `buildStamp.sha7` changes from `ff537c8`, then promote to production after smoke PASS.
