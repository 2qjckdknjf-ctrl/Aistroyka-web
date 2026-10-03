# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-27  
**Updated by:** fake metric removal on the report review screen and public demo

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Cabinet portfolio panel shows only live risk, progress, and budget — no fixed 60% or “2 projects” |
| **Live artifact** | sha7 `50762c7` on staging + prod (MATCH) before this slice |
| **Branch tip** | `main` @ `eedfdf81` before this slice |
| **Pilot scope** | **contractor-ops-only** — NOT FULL / NOT portal |
| **Runtime** | Auth: email, Apple, Google, QR. Telegram login is hidden unless a bot username is configured. Phone OTP hidden. Twilio is not a launch gate. |
| **Next** | Counsel-approved privacy/terms stay **BLOCKED_EXTERNAL**. Do not invent legal text or growth baselines. |
| **Closed** | PR #354 and PR #355 public copy on production `eedfdf8` |

## Not approved / forbidden claims

- **Not approved:** stakeholder / client **portal READY**
- **Not approved:** **FULL** (contractor + portal) pilot READY
- **Not approved:** Public GA, GDPR certification, App Store / Google Play availability
- **Not approved:** marketing AI analysis, Telegram login, or unverified KPI numbers as live facts
- Re-widen to FULL only with explicit Sasha/Commander decision + stakeholder smoke

## Notes

Deploy SoT: Cloudflare Workers (Vercel = preview only). This slice changes product copy and the report review screen, so a staging deploy is expected.

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
