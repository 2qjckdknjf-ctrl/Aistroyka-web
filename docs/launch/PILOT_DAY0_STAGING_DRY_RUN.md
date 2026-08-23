# Pilot Day 0 — Staging Dry-Run Report

**Date:** 2026-07-03  
**Operator:** Cursor agent (automated smoke)  
**Environment:** `https://staging.aistroyka.ai`  
**Production mutated:** **NO**

---

## Scripts requested vs available

| Script | On branch | Result |
|--------|-----------|--------|
| `scripts/pilot/setup_pilot_dataset.sh` | **Absent** | Not run — use dashboard + `seed_pilot_project.mjs` when client tenant exists |
| `scripts/pilot/role_smoke.sh` | **Absent** | Not run — API chain used as substitute |
| `scripts/smoke/pilot_launch.sh` | Present | **PASS** |
| `scripts/smoke/ios_mobile_api_chain.sh` | Present | **PASS** |
| `bun run smoke:pilot:check` | Present | **PASS** (E2E creds optional missing) |

---

## Commands executed

```bash
# Prereq check
cd /Users/alex/Projects/AISTROYKA && bun run smoke:pilot:check

# Staging health (manual)
curl -sS "https://staging.aistroyka.ai/api/v1/health"

# Pilot launch smoke (credentials from gitignored .env.pilot + apps/web/.env.local)
set -a && source .env.pilot && source apps/web/.env.local && set +a
export BASE_URL="https://staging.aistroyka.ai"
bash scripts/smoke/pilot_launch.sh

# Mobile API chain (same env)
export BASE_URL="https://staging.aistroyka.ai"
bash scripts/smoke/ios_mobile_api_chain.sh
```

---

## Output summary

### Health

```json
{"ok":true,"env":"staging","buildStamp":{"sha7":"7f1b42f","buildTime":"2026-07-01 12:54"}}
```

Production reference (not used for setup): `buildStamp.sha7=7f1b42f`, env `production`.

### `pilot_launch.sh`

| Check | Result |
|-------|--------|
| health | PASS |
| config | PASS |
| cron-tick | PASS (no secret) |
| ops/metrics | PASS |
| Counters snapshot | uploads_stuck=0, sync_conflicts=0, tasks_assigned_today=0 |

### `ios_mobile_api_chain.sh`

| Step | Result |
|------|--------|
| worker GET config | OK |
| worker GET projects | OK (project_id present) |
| worker POST day/start | attempted |
| worker POST report/create | OK |
| worker GET worker/sync | OK |
| manager GET me | OK (role=owner) |
| manager GET reports | OK (count=5) |
| manager GET intelligence | OK |

**Verdict:** **PASS** (worker create+sync, manager me+reports+intelligence)

---

## Not covered in this dry-run

| Item | Status |
|------|--------|
| Media upload end-to-end | **OPEN** — not in API chain run |
| Manager PATCH approve/reject | **OPEN** |
| Stakeholder portal visibility | **OPEN** — no stakeholder creds in env |
| Dedicated client tenant | **NOT CREATED** — client intake missing |
| Physical iOS TestFlight UI | **BLOCKED** — no device in session |

---

## Blockers for client launch (not staging platform)

1. Client intake incomplete
2. No client-specific tenant/project on staging or production
3. Device smoke not executed
4. `scripts/pilot/*` not merged — operator uses manual dashboard + partial smoke scripts

---

## Overall dry-run verdict

| Gate | Verdict |
|------|---------|
| Staging platform smoke | **PASS** |
| Staging ready for client tenant provisioning | **YES** |
| Client Day 0 kickoff | **NO-GO** (intake + tenant + device)
