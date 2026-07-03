# P0 — Pilot E2E Verification

**Date:** 2026-07-01  
**Scope:** worker → report → media → manager decision → client visibility (safe available paths)

---

## Verification methods used

| Method | Script / surface | Base URL |
|--------|------------------|----------|
| Mobile API chain | `scripts/smoke/ios_mobile_api_chain.sh` | https://aistroyka.ai |
| Device smoke | Manual checklist | BLOCKED (no connected physical devices) |
| Playwright E2E | `bun run --cwd apps/web e2e:pilot` | Not run — `E2E_EMAIL/PASSWORD` missing locally |

---

## Chain results

| # | Step | Result | Evidence |
|---|------|--------|----------|
| 1 | Worker auth/session | **PASS** | Password grant + Bearer JWT |
| 2 | Worker create report | **PASS** | `POST /api/v1/worker/report/create` → 201 |
| 3 | Worker sync | **PASS** | `GET /api/v1/worker/sync` → 200 |
| 4 | Media evidence/upload | **OPEN** | Not exercised in API chain this run; upload sessions exist in schema — needs dedicated media smoke |
| 5 | Manager sees reports | **PASS** | `GET /api/v1/reports` → count=5 |
| 6 | Manager approve/reject/change-request | **OPEN** | API routes exist; fresh report decision not executed this run |
| 7 | Project intelligence | **PASS** | `GET /api/v1/projects/:id/intelligence` → 200 |
| 8 | Client/owner visibility | **OPEN** | Stakeholder portal routes exist; not verified this run |

---

## Mobile distribution context (non-P0 blocker for API proof)

| Surface | Build | Store status | Device smoke |
|---------|-------|--------------|--------------|
| iOS Manager/Worker | `2026063001` | ASC VALID | BLOCKED — iPhone offline |
| Android Manager/Worker | `versionCode 2026063001` | Play internal visible | BLOCKED — no adb device |

Classification from prior run: `DEVICE_SMOKE_PARTIAL`.

---

## Gaps (classified)

| Gap | Class |
|-----|-------|
| Media attach + upload completion | **P0 important** — verify before pilot demo with photos |
| Manager decision on newly created report | **P0 important** |
| Client/stakeholder visibility of approved artifacts | **P1** (finance isolation must hold) |
| Physical TestFlight / Play internal UI smoke | **P0 blocker** for mobile-first pilot demo |
| Playwright authenticated web dashboard | **P0 important** — needs E2E creds or fixed headless login |

---

## Verdict

**PARTIAL** — backend worker→report→manager read chain **PASS** on production API. Media, manager decision action, client visibility, and device UI smoke **OPEN**.
