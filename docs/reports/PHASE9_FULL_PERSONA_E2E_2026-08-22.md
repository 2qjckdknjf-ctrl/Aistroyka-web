# Phase 9 — Full Persona E2E

**Date:** 2026-08-22  
**Baseline SHA:** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Branch:** `feature/phase9-persona-e2e-2026-08-22`  
**Target:** `https://staging.aistroyka.ai` (`buildStamp.sha7=a714424`)  
**Status:** **CLOSED**

---

## 1. Phase gate (roadmap)

Prove **one synthetic construction project end-to-end** without manual SQL: company → manager → worker → project → milestone → task → shift → evidence → report → submit → manager review → changes requested → resubmit → approval → document → cost → intelligence → owner/client visibility; web↔mobile sync.

---

## 2. Persona workflow matrix

| Step | Surface | Result | Evidence |
|------|---------|--------|----------|
| Company / tenant bootstrap | API + existing smoke tenant | **PROVEN** (pre-existing tenant; no greenfield company create this pass) | `SMOKE_*` auth + `GET /api/v1/projects` |
| Manager vs worker personas | Separate accounts | **NOT TESTED** — single `SMOKE_*` account used for worker + manager API (role allows both) | — |
| Project create (greenfield) | API / dashboard | **NOT TESTED** — tenant already has projects | `GET /api/v1/projects` → 5 rows |
| Milestone create | `POST /api/v1/projects/:id/milestones` | **FAILED** — HTTP 403 `Create failed` on smoke project | API probe 2026-08-22 |
| Task list / assign | API + web | **PARTIAL** — `GET /api/v1/tasks` 200, count 0; task→report UI smoke PASS | Playwright `pilot-task-report-smoke` |
| Shift | API | **NOT TESTED** — no shift route exercised |
| Evidence (upload session + media) | Worker API | **PROVEN** — upload session + `add-media` + submit | `persona-api-chain-summary.json` |
| Report create | Worker API | **PROVEN** | `sync.e2e.test.mjs` + persona chain |
| Report submit | Worker API | **PROVEN** (requires photo proof) | persona chain |
| Manager review (changes → resubmit → approve) | `PATCH /api/v1/reports/:id` | **PROVEN** (manager client must not be `ios_lite`) | persona chain |
| Approval history | `GET /api/v1/reports/:id/approval-history` | **PROVEN** | persona chain |
| Document / handover | Project documents API | **NOT TESTED** — no document upload chain this pass |
| Cost (internal) | `GET /api/v1/projects/:id/cost-items` | **NOT TESTED** — HTTP 404 on probe project |
| Intelligence | `GET /api/v1/projects/:id/intelligence` | **PROVEN** — `projectHealthScore` present | API probe |
| Proof pack (customer-safe) | `GET /api/v1/projects/:id/proof-pack` | **PROVEN** — HTTP 200 | API probe |
| Owner / client portal visibility | `/portal` stakeholder | **NOT TESTED** — no `STAKEHOLDER_SMOKE_*` session this pass |
| Web ↔ mobile sync | Sync API + iOS | **PROVEN** sync contract; iOS Layer B **cited Phase 5** (#232) | sync E2E + Phase 5 report |
| Android field persona | Android app | **NOT TESTED** — deferred pilot policy (Phase 6) |

---

## 3. Automated checks (@ staging)

| Check | Result |
|-------|--------|
| `bun run e2e:pilot` (`dashboard-button-audit` + `sync-contract` + `core-flow`) | **PROVEN** — 21 passed, 1 skipped (`cta.dashboard.projects.viewAll` — empty projects CTA state) |
| `pilot-task-report-smoke` + `audit-dashboard-smoke` + `ai-smoke` (chromium) | **PROVEN** — 8 passed, 3 skipped (project Copilot / server Copilot deps) |
| `node --test tests/sync/sync.e2e.test.mjs` | **PROVEN** — 8/8 pass (device, bootstrap, changes, report create propagation, ack, idempotency, 409 conflict) |
| `bash scripts/smoke/pilot_launch.sh` | **PROVEN** — health, config, cron-tick, ops/metrics |
| Worker report API chain (create → media → submit → review loop) | **PROVEN** — see `docs/audit/artifacts/phase9-2026-08-22/persona-api-chain-summary.json` |
| iOS Layer B staging E2E | **CITED** — Phase 5 CONDITIONAL YES (#232); not re-run this pass |

**Artifact dir:** `docs/audit/artifacts/phase9-2026-08-22/` (sync request log redacted; Playwright CTA JSON).

---

## 4. Findings

1. **Submit proof gate is real on staging** — `POST /api/v1/worker/report/submit` returns `400 proof_required` without `add-media`; fixed in chain by upload session attachment.
2. **Manager review blocked for `ios_lite` client** — `PATCH /api/v1/reports/:id` returns `403 Insufficient rights` with `x-client: ios_lite`; succeeds without lite worker client header (by design in `reports/[id]/route.ts`).
3. **Full greenfield construction workflow not closed** — milestone create 403, zero tasks in tenant, no shift/document/cost/stakeholder portal proof.
4. **Single-account smoke** — does not prove separate worker/manager tenant memberships or project-manager RBAC edge cases.

---

## 5. Blockers

| Blocker | Type |
|---------|------|
| Greenfield project → milestone → task → shift chain | **OPEN** — milestone 403; tasks empty |
| Separate worker vs manager credentials | **BLOCKED_EXTERNAL** — only `SMOKE_*` available locally |
| Stakeholder / client portal E2E | **BLOCKED_EXTERNAL** — `STAKEHOLDER_SMOKE_*` not exercised |
| Android persona | **DEFERRED BY DECISION** — first pilot = web + iOS |
| Physical device cross-surface sync | **DEVICE_SMOKE_PARTIAL** — Phase 5 iOS sim/staging only |

---

## 6. Closure verdict

**CONDITIONAL YES** — core **worker report lifecycle** (create → evidence → submit → manager changes → resubmit → approve) and **mobile sync contract** are **PROVEN** on staging @ `a714424`; Playwright pilot + sync node tests green. The **full roadmap persona** (greenfield project, milestone, task, shift, documents, cost, separate personas, client portal) remains **NOT TESTED** or **FAILED** where noted.

Safe to proceed to **Phase 10 — Reliability & Operations** without claiming complete synthetic construction-project closure.

**Next:** provision distinct worker/manager smoke accounts; fix or document milestone-create 403 on pilot project; run stakeholder portal smoke; optional fresh iOS Layer B log on current SHA.

---

*Phase 9 — 100% Readiness execution.*
