# Wave 3 — Deploy path truth

**Date:** 2026-03-28 (UTC)

---

## A1. Repo deployment artifacts

| Artifact | Role |
|----------|------|
| `apps/web/vercel.json` | **Vercel** project settings: `installCommand` + `buildCommand` from **repo root** (`npm run build:contracts:npm` + `npm run build:web:npm`). |
| `apps/web/package.json` | **Cloudflare Workers** via `@opennextjs/cloudflare`: `cf:build`, `cf:deploy`, `cf:deploy:prod` (wrangler, `env.production`). |
| `package.json` (root) | `cf:deploy`, `cf:deploy:prod` delegating to `apps/web`; `smoke:pilot` → `scripts/smoke/pilot_launch.sh`. |
| `.github/workflows/ci.yml` | **CI** on `pull_request` + `push` to `feature/**` only — **does not run on `push` to `main`**, so **no automatic production deploy** from this workflow. |

---

## A2. Git truth (verified locally + `git fetch`)

| Item | Value |
|------|--------|
| **Branch** | `main` |
| **HEAD** | `b17589b8` (docs) after Wave 3 code commit |
| **`8ea16034` in `main`** | **YES** (ancestor of `HEAD`) |
| **`b17589b8` in `main`** | **YES** |
| **`origin/main`** | Matches local after `git fetch` |

---

## A3. Expected deploy mechanism (evidence-based)

1. **Vercel:** If the Vercel project is Git-connected to this repo, **push to `main`** can trigger a **Vercel Production** deployment per Dashboard settings (not visible from repo alone).
2. **Cloudflare:** `apps/web/wrangler.toml` defines **`[env.production]`** → `name = "aistroyka-web-production"` with `NEXT_PUBLIC_APP_URL = "https://aistroyka.ai"`. Production traffic for **aistroyka.ai** is consistent with **manual or CI-driven** `wrangler deploy --env production` (or `npm run deploy:prod` / `bun run deploy:prod`).

**Conclusion:** The repo supports **at least two** publish paths; **which one serves `https://aistroyka.ai` in practice** must be confirmed in **Cloudflare Dashboard** (route → worker) and/or **Vercel** (domain assignment). **Git push alone does not prove** production updated (CI does not deploy `main`).

---

## A4. Build stamp (public proof)

`GET /api/v1/health` → `buildStamp.sha7` from `getBuildStamp()` (`NEXT_PUBLIC_BUILD_SHA` → `VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`).

---

## A5. Wave 3 commits “in main”

**YES** — `8ea16034` (Wave 3 code) and `b17589b8` (docs) are on **`main`** and pushed to **`origin`**.

---

## A6. Evidence that production “caught up”

**Not available in repo:** requires live **`health`** showing `sha7` **`8ea1603`** (or newer `main` SHA) **or** Dashboard deploy success.

**Observed (2026-03-28):** `buildStamp.sha7` = **`3d329d3`** — **older than** `8ea16034`.

---

**Status:** **Repo and `main` are correct; production deploy linkage is unproven and health shows stale SHA.**
