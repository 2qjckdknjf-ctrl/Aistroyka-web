# Wave 3 — Deploy alignment report

**Date:** 2026-03-28 (UTC)

---

## B1. Deploy trigger path used in this session

| Action | Result |
|--------|--------|
| **Automated deploy from this environment** | **None** — no `wrangler` / Vercel CLI with credentials executed (would require operator secrets). |
| **Git state** | `main` at **`b17589b8`** includes **`8ea16034`**. |

---

## B2. Polling `GET https://aistroyka.ai/api/v1/health`

| Timestamp (UTC) | `buildStamp.sha7` |
|-----------------|-------------------|
| 2026-03-28T18:43:23Z | **`3d329d3`** |

**Interval:** Single disciplined poll + prior session history (no sustained spam).

---

## B3. New SHA observed?

**NO.** Expected after Wave 3 rollout: **`8ea1603`** (short SHA of `8ea16034`) or **`b17589b`** / full short SHA of latest `main`.

---

## B4. Strongest explanation (no Dashboard access)

| Hypothesis | Likelihood |
|------------|------------|
| **Production is Cloudflare Worker** `aistroyka-web-production` and **was not redeployed** after `git push` | **High** — matches `wrangler.toml` + **no** `main` deploy in root CI. |
| **Vercel** not auto-deploying this repo’s `main`, or **aistroyka.ai** not pointed at that Vercel project | Possible — verify in Dashboard. |
| **Build stamp env** not set on CF build → stale `VERCEL_GIT_COMMIT_SHA` | Possible secondary issue; **does not explain** missing Wave 3 **behavior** (submit still **200** without proof). |

---

## B5. Runtime aligned with Wave 3 repo?

**NO** (observed).

**Evidence:**

- **`health`** ≠ `8ea1603`
- **`POST /api/v1/worker/report/submit`** without media → **HTTP 200** with `status: "queued"` (live probe 2026-03-28) — **incompatible** with `proof_required` in `8ea16034`

---

## B6. Smallest operator step to align

1. **Identify** whether **aistroyka.ai** is served by **Cloudflare Worker** or **Vercel**.
2. **Run** the project’s canonical production deploy (e.g. `cd apps/web && npm run deploy:prod` or Vercel “Redeploy” from latest `main`) with correct secrets.
3. **Re-poll** `health` until `sha7` matches **`8ea1603`** or newer **`main`**.

---

**Status:** **NOT ALIGNED**
