# AISTROYKA Pilot Backlog (Prioritized)

**Version:** 2026-07-01  
**Companion:** `PILOT_READINESS_ROADMAP.md`

---

## P0 — Must close before pilot

| ID | Title | Owner area | Files likely touched | Validation | Done definition | Blocked by |
|----|-------|------------|----------------------|------------|-----------------|------------|
| P0.1 | Production deploy truth | Release/Ops | — (read-only) | `curl` health, GH Actions, `buildStamp` | Production SHA = `origin/main`; method documented | — |
| P0.2 | Env/config gate | Release/Ops | `scripts/release/check-env-config.sh` | `bash scripts/release/check-env-config.sh <mode>` | Required vars documented; script exits 0 in CI | Cloudflare dashboard secrets (operator) |
| P0.3 | Pilot smoke live | Release/Ops | `scripts/smoke/pilot_launch.sh` | `BASE_URL=… bash scripts/smoke/pilot_launch.sh` | health+config+metrics PASS; cron documented | `CRON_SECRET` for cron-tick full pass |
| P0.4 | Step 13 Cost live | Backend/DB | `apps/web/scripts/verify-cost-runtime.mjs`, migration `20260307500000` | MCP `list_migrations`, runtime script | GET/POST/PATCH costs on staging+prod | — |
| P0.5 | Pilot E2E path | Mobile/Web API | `scripts/smoke/ios_mobile_api_chain.sh` | Live API chain | worker report + manager reports + intelligence | Media upload UI path; client visibility; device smoke |
| P0.6 | P0 validation + verdict | QA/Release | `docs/pilot/P0_*` | lint, test, cf:build, smoke | Post-audit + GO/NO-GO published | 1 test parse failure (`AISignalLine.test.ts`) |

---

## P1 — Must close for strong pilot

| ID | Title | Owner area | Files likely touched | Validation | Done definition | Blocked by |
|----|-------|------------|----------------------|------------|-----------------|------------|
| P1.1 | Documents create/upload UI | Web dashboard | `apps/web/app/**/documents/**`, upload forms | UI + API tests | Manager creates doc + uploads file | P0 |
| P1.2 | Document linkage | Web/API | document routes, project/report/task links | Integration tests | Link to project + optional report/task/milestone | P1.1 |
| P1.3 | Review workflow | Web/API | status transitions | State machine tests | draft → uploaded → under_review → approved/rejected | P1.1 |
| P1.4 | Approval queue | Web dashboard | manager actions, inbox | E2E smoke | Pending docs/reports visible with links | P1.3 |
| P1.5 | Resubmit flow | Web/API | approval events | Tests | changes_requested → resubmit → approve | P1.3 |
| P1.6 | Manager action integration | Web | manager surfaces | Manual + automated | Docs/reports in manager workload | P1.4 |

---

## P2 — Pilot packaging

| ID | Title | Owner area | Validation | Done definition | Blocked by |
|----|-------|------------|------------|-----------------|------------|
| P2.1 | Pilot dataset | Ops/Backend | seed scripts | Demo project + reports + docs + costs | P1 |
| P2.2 | Role smoke | QA | per-role checklist | owner/admin/manager/worker/client PASS | P1 |
| P2.3 | Client/Owner view polish | Web portal | stakeholder routes | Progress/photos/docs/decisions visible; no internal finance | P1, finance isolation audit |
| P2.4 | Onboarding flow | Web | signup → project → invite | Owner can stand up workspace | P2.1 |
| P2.5 | Pilot runbook | Docs | owner review | First-client instruction doc | P2.2 |

---

## P3 — Android decision

| ID | Title | Options | Validation | Done definition | Blocked by |
|----|-------|---------|------------|-----------------|------------|
| P3.0 | Android defer vs MVP | A: defer (recommended) / B: Worker MVP | Owner sign-off | Written decision in docs | P0 closure |
| P3.1 | Android Worker MVP (if B) | Mobile Android | Play internal + device smoke | login → report → photos → submit | Product scope approval |

---

## P4 — Post-pilot scaling (explicitly out of scope now)

- Android Manager product contour  
- Marketplace / BIM / ERP  
- New AI dashboard / mass marketing  
- Billing/account-first cutover (`ENTITLEMENT_RESOLUTION_SOURCE`)  
- Broad Liquid Glass redesign merges  

---

## Current sprint focus

**Start only P0.** P1+ backlog is frozen until P0 post-audit.
