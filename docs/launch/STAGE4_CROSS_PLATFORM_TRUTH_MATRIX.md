# STAGE 4 — Cross-platform truth matrix

**Date:** 2026-03-25 (UTC)  
**Runtime status:** **Production API** allows **lite Worker project list**; **device** Maestro cross-platform proof **not captured** this session (no JDK 17+ for Maestro).

## Preconditions (2026-03-25)

| Check | Evidence |
|-------|----------|
| Authenticated smoke | **GREEN** — `pilot_launch.sh` exit 0; `ops/metrics` **200** |
| Pilot project seed | **`scripts/smoke/seed_pilot_project.mjs`** — `project_members` for smoke user |
| **Production `android_lite` GET /api/v1/projects** | **200** — includes **“STAGE4 Pilot Project”** (verified after **GH Actions** deploy, commit **`f2201eed`**) |
| **`GET /api/health` buildStamp** | **`sha7: f2201ee`** on `https://www.aistroyka.ai/api/health` |
| Maestro | **Not run** — **Java 17+** not available on validation host |

## Intended contracts (repo)

| Topic | Source |
|--------|--------|
| Worker | `WorkerApi`, **`GET /api/v1/projects`** (lite), `/api/v1/worker/*`, media |
| Manager | `ManagerApi`, `/api/v1/reports`, PATCH review |
| Lite allow-list | `lib/api/lite-allow-list.ts` — **GET** `/api/v1/projects` only for `ios_lite`/`android_lite` |

## Runtime matrix — evidence

| Check | Evidence |
|-------|----------|
| **API:** Worker-style project list (lite) | **Verified** — production **200** + pilot project name in JSON |
| Android Worker submit → report ID | **Not captured** — Maestro not executed |
| Same report → Android Manager / review | **Not captured** |
| iOS Worker / Manager | **Not run** |
| Cross-platform (Android ↔ iOS ↔ web) | **Not proven** — no device report UUID this session |

## CI / deploy note

- **Workflow:** `Deploy Cloudflare (Production)` run **`23534971283`** — **Cloudflare deploy succeeded**; step **Verify pilot smoke secret (production)** failed (`PILOT_SMOKE_BEARER_PRODUCTION` not configured). Does **not** negate successful Worker API verification above.

## Blockers for full matrix closure

1. Run **Maestro** (`android_worker_pilot.yaml` → `android_manager_pilot.yaml`) on a host with **JDK 17+** and capture **report id** + **review action**.
2. Optionally run **iOS** flows when simulator + apps are ready.
