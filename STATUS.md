# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-14  
**Updated by:** docs — scope freeze contractor-ops-only (Grow OS TASK-AISTROYKA-002)

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Contractor-ops pilot baseline — TASK-AISTROYKA-002 **READY** (soft gate) |
| **Live artifact** | sha7 `09f7bcd` on staging + prod (MATCH) |
| **Branch tip** | `main` (git tip may be ahead of Worker build; trust live `buildStamp.sha7`) |
| **Pilot scope** | **contractor-ops-only** — NOT FULL / NOT portal |
| **Gate** | AC-002-1 PASS · AC-002-2 **N/A** · AC-002-3 CLOSED · AC-002-4 PASS @ live |
| **Runtime** | Auth: email, Apple, Google, QR, Telegram where enabled. Phone OTP hidden/disabled. Twilio is not a launch gate. |
| **Next** | Hold portal/stakeholder until new scope decision; HiAir Play/ASC separate; keep entitlement account-first OFF |
| **Closed** | PR #277; PR #342 STATUS refresh; PR #343 paths-ignore; contractor-ops READY 2026-09-14 |

## Not approved / forbidden claims

- **Not approved:** stakeholder / client **portal READY**
- **Not approved:** **FULL** (contractor + portal) pilot READY
- **Not approved:** finance-boundary proof for portal users (AC-002-2 N/A — not closed, out of scope)
- **Not approved:** new production feature deploys beyond current live artifact (this STATUS is docs only)
- Re-widen to FULL only with explicit Sasha/Commander decision + stakeholder smoke

## Notes

Deploy SoT: Cloudflare Workers (Vercel = preview only). Docs merges: prefer `[skip-staging-deploy]` in commit message; STATUS.md is also under staging `paths-ignore` (#343).

---

## Planning update — 2026-09-23

Docs branch: `docs/roadmap-consolidation-2026-09-23`, based on main `25b33d841189b31ff43538762b72a4f7024d701f`. [Handoff](docs/handoff/2026-09-23-roadmap-consolidation.md). New roadmap is future backlog; contractor-ops-only pilot remains the active scope. Runtime status above is historical and was not re-certified by this docs update. Next: fresh pilot/security gap audit before customer expansion.

## Planning follow-up — 2026-09-24

Same docs branch/PR #350: ROMA execution-assurance contracts and Owner AI Report/spatial context AC expanded in the linked amendments. All remain PLANNED. Current pilot scope and historical runtime status above unchanged; [handoff](docs/handoff/2026-09-23-roadmap-consolidation.md) updated.

## Planning follow-up — 2026-09-25

PR #350 on the same docs branch now includes PresenceProof, capability lifecycle/default deny and action-bound customer/release approvals. See existing linked amendments and handoff. All PLANNED; active contractor-ops-only pilot and historical runtime status remain unchanged.

## Planning follow-up — 2026-09-26

PR #350 updated with execution-plane contracts and an explicit implementation order; AIS-MATERIAL-008 refined as a persistent Supply Agent after pilot/Graph. Existing roadmap links lead to current sections. All PLANNED; contractor-ops-only pilot, runtime status and release gates unchanged.

## Planning follow-up — 2026-10-02

Existing PR #350 adds Observer/DAG, Failure/eval corpus and Construction corrections contracts. All PLANNED. Read latest dated sections via existing roadmap links. Main observed at `0e3b1ede624183ac5e5d47ab3f72ad739553ebb7`; runtime not checked. Older pilot/deploy status in this branch is historical, not a current readiness verdict. Before implementation/integration reconcile latest main/STATUS and preserve newer work.

## Planning follow-up — 2026-10-03

PR #350 plans updated for routing/reasoning, host/secret/capability drift and streaming/spatial Graph. Tasks have dependencies/AC in latest dated sections; all PLANNED. Runtime and historical readiness above not re-certified; reconcile current main/STATUS before implementation.

## Planning follow-up — 2026-10-07

PR #350 planning amendments cover signals Oct 4–6: Outcome/hidden holdout/promotion, data scope/flow, intent/design/delta budget and runtime kill controls; AISTROYKA evidence completeness/spatial providers/Graph Views/project holdout/Construction Rules. Read latest dated sections via existing roadmap/handoff links. All PLANNED. Runtime/deployment not checked; older status above remains historical. Reconcile current main and preserve its changes before implementation/integration.

## Planning follow-up — 2026-10-07 evening
PR #350 adds retrieval/Construction Memory, preventive artifact egress/destination contracts and deterministic skill verification in latest sections. All PLANNED; older runtime status not re-certified. Integration must preserve current main changes. Handoff links include Obraprecio planning PR #59 and portfolio/HiAir scope.
