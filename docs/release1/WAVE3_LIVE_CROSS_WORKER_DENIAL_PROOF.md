# Wave 3 — Live cross-worker denial proof

**Date (UTC):** 2026-03-28  
**Production:** `https://www.aistroyka.ai`  
**Runtime `buildStamp.sha7` (health):** `6a808bd` (deploy includes lite peer isolation)

## Identities

| Label | User id | Role (tenant_members) | Notes |
|-------|---------|------------------------|--------|
| **Worker A** | `1aabc16d-130a-4e11-8e63-10cc2b34f29d` | `owner` | Smoke / pilot user |
| **Worker B** | `c2b2b2b2-b2b2-4b2b-b2b2-b2b2b2b2b2b1` | `member` | Seeded via SQL |

## Peer-owned entity

- **Report id:** `d3d3d3d3-d3d3-4d3d-d3d3-d3d3d3d3d3d1` — **owner** = Worker B.

## D1 — Worker A cannot read Worker B’s report (lite)

- **Request:** `GET /api/v1/reports/d3d3d3d3-d3d3-4d3d-d3d3-d3d3d3d3d3d1`
- **Headers:** `Authorization: Bearer <Worker A access token>`, **`x-client: ios_lite`**
- **Result:** **HTTP 404** — `{"error":"Not found"}`
- **Not** a bogus UUID — real row exists (proven by B’s read below).

## D2 — Worker B can read own report (ownership control)

- **Same path and report id**
- **Headers:** `Authorization: Bearer <Worker B access token>`, **`x-client: ios_lite`**
- **Result:** **HTTP 200** — `data.id` matches, `data.user_id` = Worker B.

## D3 — Task denial

- **Not executed** — no peer `worker_tasks` row in tenant (see peer entity report).

## Bogus UUID substitute

**NO** — proof uses **real** peer-owned report id.

## Classification

| Check | Level |
|-------|--------|
| Report denial (A → B’s report, lite) | **FULL** |
| Task denial (A → B’s task) | **OPEN** (no peer task) |
| Overall Wave 3 cross-worker narrative | **FULL** for required report path |
