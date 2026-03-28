# Wave 3 — Deploy truth report

**Date:** 2026-03-28

---

## A1. Canonical deploy path

| Item | Detail |
|------|--------|
| **App host** | `https://aistroyka.ai` (per `NEXT_PUBLIC_APP_URL` / operator usage). |
| **Git remote** | `origin` → GitHub (`main`). |
| **Typical CI/CD** | Vercel Git integration on push to `main` (per monorepo / `vercel.json` pattern — not re-verified in Dashboard in this session). |

---

## A2. Root cause of “prod ≠ repo” (Wave 3)

| Finding | Evidence |
|---------|----------|
| **Wave 3 server changes were not on `origin/main`** | Local working tree contained uncommitted edits to `report.service.ts`, `lite-allow-list.ts`, and related routes. |
| **Production `buildStamp.sha7` matched old `main`** | `GET /api/v1/health` returned `sha7: "3d329d3"` while local `HEAD` was `3d329d3` **without** Wave 3 file content — **same commit hash, different tree** until commit. |

**Resolution applied in this sprint:** minimal **Wave 3–only** commit and **push** to `main`.

---

## A3. Commit pushed (intended runtime)

| Field | Value |
|-------|--------|
| **Commit** | `8ea16034` (full: `8ea16034…`) |
| **Short SHA** | `8ea1603` |
| **Message** | `fix(web): Wave 3 worker proof gate, lite task/report paths, worker task detail` |
| **Files** | 10 files: `report.service.ts`, worker submit route, tasks/reports GET routes, `task.service` + tests, `lite-allow-list` + tests, `pilot_launch.sh` |

**Push:** `git push origin main` **succeeded** (`3d329d38..8ea16034`).

---

## A4. Production alignment (observed after push)

| Check | Result |
|-------|--------|
| **`GET /api/v1/health` `buildStamp.sha7`** | Remained **`3d329d3`** across **~10+ minutes** of polling (15–20s intervals). |
| **Interpretation** | **New deployment not yet visible** on the checked host within the session window, **or** build stamp source not updated on every deploy, **or** Vercel build queue / manual approval / different production mapping. |

**Evidence limit:** No Vercel Dashboard / API access in this session to confirm build status.

---

## A5. Canonical target for verification

| Target | Use when |
|--------|----------|
| **Production** `https://aistroyka.ai` | Final Wave 3 truth once **`health.buildStamp.sha7` = `8ea1603`** (or newer on `main`). |
| **Preview URL** | Optional for pre-prod checks; **not** used here. |

---

## Blocker (if closure requires live proof)

1. **Operator must confirm** Vercel production deployment for commit **`8ea16034`** (success + promote if Preview-only).
2. **Re-poll** `/api/v1/health` until `sha7` reflects the new build **or** confirm equivalent deploy artifact in Vercel UI.

---

**Status:** **Code on `main` — YES.** **Production runtime aligned (observed) — NOT YET.**
