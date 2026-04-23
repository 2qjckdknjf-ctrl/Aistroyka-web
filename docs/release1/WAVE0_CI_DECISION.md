# Wave 0 — Authoritative CI decision (G2)

**Date:** 2026-03-26 (UTC)

---

## 1. Workflow inventory

### 1.1 Root `.github/workflows/` (repository default discovery)

| File | Purpose |
|------|---------|
| `deploy-cloudflare-prod.yml` | Push `main` → `bun install`, `cf:build`, Wrangler **production** |
| `deploy-cloudflare-staging.yml` | Staging deploy |
| `pilot-smoke.yml` | Pilot smoke |
| `apply-migrations.yml` | Supabase migrations |
| `snapshot-backup.yml` | Backup |
| `update-lockfile-linux.yml` | Lockfile |
| **`ci.yml`** | **Added Wave 0** — lint, test, `cf:build`, Playwright e2e (PR `main`, push `feature/**`) |

### 1.2 Nested `apps/web/.github/workflows/`

| File | Purpose |
|------|---------|
| `ci.yml` | **Same jobs** as root `ci.yml` (duplicate) |
| `deploy.yml` | Deploy to Cloudflare on `main` / `workflow_dispatch` |

---

## 2. Conflicts / ambiguity (resolved)

| Issue | Resolution |
|-------|------------|
| **GitHub only auto-loads** `/.github/workflows/*.yml` **at repo root** | Workflows under `apps/web/.github/` are **not** standard and may **never run** on github.com unless the repo is configured unusually. |
| **Two deploy paths** | Root `deploy-cloudflare-prod.yml` vs `apps/web/.github/workflows/deploy.yml` — both target Cloudflare; **risk** of duplicate deploy if both active. **Authoritative production:** root `deploy-cloudflare-prod.yml` (matches `AGENTS.md` / package scripts). |

---

## 3. Authoritative CI decision (frozen)

| Concern | Authoritative workflow |
|---------|-------------------------|
| **Production deploy (main)** | **`.github/workflows/deploy-cloudflare-prod.yml`** |
| **PR quality gate (lint / test / cf:build / e2e)** | **`.github/workflows/ci.yml`** at **repo root** (Wave 0) |
| **Staging deploy** | `.github/workflows/deploy-cloudflare-staging.yml` |
| **Migrations** | `.github/workflows/apply-migrations.yml` |

**Non-authoritative / verify or deprecate:**

- `apps/web/.github/workflows/ci.yml` — **duplicate** of root CI; safe to **delete** in a future cleanup **or** keep as mirror with comment — **do not rely** on it for GitHub discovery.
- `apps/web/.github/workflows/deploy.yml` — **potential duplicate** of root deploy; confirm in GitHub UI whether it runs; if redundant, disable to avoid double deploy.

---

## 4. What runs for each stack

| Stack | Runs today (authoritative) |
|-------|----------------------------|
| **Web** | Root `ci.yml` (lint, test, cf:build, e2e); `deploy-cloudflare-prod.yml` on `main` |
| **Android** | **No** dedicated workflow in repo — **gap** |
| **iOS** | **No** dedicated workflow in repo — **gap** |

---

## 5. Minimal fixes applied (Wave 0)

| Change | Rationale |
|--------|-----------|
| Added **root** `.github/workflows/ci.yml` | Closes **PR CI** discovery gap; aligns with standard GitHub behavior. |

---

## 6. Remaining CI gaps

1. **Android:** no `gradle` job in CI — add when R1 requires automated APK build.  
2. **iOS:** no `xcodebuild` job — add using `scripts/ios/build-simulator.sh` pattern + macOS runner (or external).  
3. **Duplicate** workflows under `apps/web/.github/` — reconcile to avoid double runs.  
4. **Confirm** on GitHub **Actions** tab: no unexpected workflow from nested paths.
