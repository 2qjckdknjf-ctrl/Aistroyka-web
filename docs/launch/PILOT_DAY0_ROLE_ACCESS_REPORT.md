# Pilot Day 0 — Role Access Report

**Date:** 2026-07-03  
**Client tenant:** **N/A** (not provisioned)  
**Evidence:** Staging API smoke with existing operator smoke account

---

## Roles prepared for client

| Role | Account | Status |
|------|---------|--------|
| Owner / admin | — | **NOT CREATED** (no client) |
| Manager | — | **NOT CREATED** |
| Worker | — | **NOT CREATED** |
| Stakeholder / client | — | **NOT CREATED** |

---

## Staging smoke account (platform verification only)

Dry-run authenticated as configured `SMOKE_EMAIL` (gitignored — not recorded here).

| Check | Result | Evidence |
|-------|--------|----------|
| Manager/owner API access | **PASS** | `GET /api/v1/me` → role `owner` |
| Worker project access | **PASS** | `GET /api/v1/projects` → project_id present |
| Worker report create | **PASS** | `POST /api/v1/worker/report/create` |
| Worker sync | **PASS** | `GET /api/v1/worker/sync` |
| Manager reports inbox | **PASS** | `GET /api/v1/reports` count=5 |
| Stakeholder portal | **NOT TESTED** | No `STAKEHOLDER_SMOKE_*` in `.env.pilot` |
| Internal finance denied to stakeholder | **NOT TESTED** | Requires stakeholder account on client tenant |

---

## Expected verification (when client tenant exists)

### Manager

- [ ] Web dashboard `/dashboard` loads
- [ ] Projects, tasks, approvals visible
- [ ] Can PATCH report (approve / request changes)

### Worker

- [ ] iOS Worker login (TestFlight)
- [ ] Today's tasks visible
- [ ] Report submit succeeds

### Stakeholder

- [ ] Portal login via invite accept
- [ ] Sees progress / approved artifacts only
- [ ] **Does NOT** see internal costs, margin, subcontractor costs

### Denied access

- [ ] Stakeholder cannot open contractor cost/budget internals
- [ ] Worker cannot access manager-only routes
- [ ] Cross-tenant isolation (if multi-tenant test)

---

## Android check (role path)

| Question | Answer |
|----------|--------|
| Android Worker required | **NO** |
| Android accounts needed | **NO** |

---

## Day 0 verdict

| Gate | Result |
|------|--------|
| Client role matrix verified | **NO** — no client accounts |
| Platform API role smoke | **PARTIAL PASS** (owner/worker API paths on smoke user) |
| Stakeholder isolation proof | **OPEN** |

**Blocker:** Provision client tenant + run role matrix before launch GO.
