# AISTROYKA 100% Completion Audit — 2026-10-03

**Classification:** `production-capable / controlled-pilot candidate` — not Public GA  
**Audit type:** repository + live health reconciliation. This is the start of execution, not a closure verdict.  
**Auditor SHA (worktree):** `audit/100-percent-completion-2026-10-03` branched from `origin/main`.

## 1. Runtime truth (observed this session)

| Layer | Value | Evidence |
|-------|-------|----------|
| `origin/main` | `0e3b1ede624183ac5e5d47ab3f72ad739553ebb7` (`0e3b1ed`) | `git rev-parse origin/main`; includes merged PR #369 notification-opened telemetry |
| Production `https://aistroyka.ai` | `ok=true`, `db=ok`, `buildStamp.sha7=0e3b1ed`, `buildTime=2026-09-27 22:33`, `aiConfigured=true`, `openaiConfigured=true` | `GET /api/v1/health` 2026-10-03 |
| Staging `https://staging.aistroyka.ai` | `ok=true`, `db=ok`, `buildStamp.sha7=0e3b1ed`, `buildTime=2026-09-27 22:29` | same |
| Runtime ↔ source | **MATCH** | prod/staging sha7 equals current main tip |
| Primary checkout `/Users/alex/Projects/AISTROYKA` | `release/phase8-ops-2026-08-02` @ `b25dc97d` dirty | **not** current truth; do not implement there |
| `AISTROYKA-main-clean` | `fix/cabinet-logic-slice-04` @ `0ef84d33` | not current main |
| PR #350 | DRAFT, docs-only, HEAD `b7db42084d330473b6ff1a67ca40b8909673a5c1` | user-cited `ceeeee1a` is the 2026-10-02 commit; 2026-10-03 added routing/streaming/spatial |
| PR #350 merge-base | `25b33d841189b31ff43538762b72a4f7024d701f` | **behind** current main; cannot be merged blindly |

`STATUS.md`, `docs/CURRENT_PROJECT_TRUTH_INDEX.md`, and `docs/status/AISTROYKA_CURRENT_TRUTH.md` on main were stale relative to this SHA before this audit. Runtime health wins.

## 2. PR #350 reconciliation

PR #350 is **valid future backlog**, not current product certification.

Preserved (still the implementation order unless a later merged ADR supersedes it):

1. AIS-PILOT-001 security/auth/video authorization  
2. AIS-OWNER-001 portal E2E / finance isolation  
3. AIS-OWNER-002 Customer iOS (no merge of Manager/Worker)  
4. AIS-EVID-002 evidence chain  
5. AIS-VISION-003 async video/drawing jobs  
6. AIS-CLIENT-005A async multimodal intake  
7. AIS-GRAPH-004 Construction Graph  
8. AIS-CLIENT-005B live intake (flag off; after Graph)  
9. AIS-MATCH-006 explainable matching  
10. AIS-MATERIAL-008 supply agent (LATER)  
11. ROMA assurance contracts (advisory until ADR)

Removed/annotated as stale from a naive merge:

- PR #350 `STATUS.md` appends on top of September 23 main; they would hide 2026-09-27 STATUS (`contractor-ops-only`, legal BLOCKED_EXTERNAL).
- “Verified main 25b33d84” is historical.
- Claims that Customer iOS “was not found in a previous audit” are restated as **MISSING on current main** (no `AiStroykaCustomer` Xcode target).
- Gemini/model digest versions remain unverified research inputs.

Reconciled docs live in this branch:

- `docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md`
- `docs/roma/ROMA_EXECUTION_ASSURANCE_PLAN_2026-09-23.md`
- `docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md`
- matrix CSV sibling to this file

## 3. What is actually on current main

| Surface | Current status | Notes |
|---------|----------------|-------|
| Web contractor cabinet | PARTIAL | Routes exist for projects, tasks, reports, approvals, defects, documents, costs, notifications, AI panels. Unmerged P1s hide submitted reports from approvals/summary. |
| Auth web | PARTIAL | Email, Apple, Google exist. Phone OTP hidden. Telegram gated. Identity-link fixes assumed from prior merges — not re-proven this audit. |
| Stakeholder portal | PARTIAL | `/portal` + `/api/v1/portal`. Production STATUS: portal **not** approved READY. Open P0: stakeholder self-reactivation via PostgREST (PR #351, unmerged until this slice). |
| Customer self-serve intake | MISSING | No dedicated intake workspace independent of contractor-led project. |
| Customer iOS | MISSING | Only Manager + Worker Xcode projects. |
| iOS Manager/Worker | PARTIAL | Real apps + Shared PKCE OAuth (Apple + Google providers in `AuthPKCE.swift`). Store upload OWNER_GATE. Device smoke not re-run this session. |
| Android Manager/Worker | PARTIAL | Compose apps on main; first-pilot Android still DEFERRED_BY_DECISION unless owner reverses. |
| Construction Graph product | MISSING | ROMA kernel graph types exist; no AISTROYKA domain graph tables/API for rooms/elements/work packages. |
| Matching | MISSING | Contractor directory exists; explainable marketplace matching does not. |
| Materials supply agent | MISSING | LATER in roadmap. |
| Video daily AI | BROKEN authz | `POST /api/v1/ai/analyze-video-daily` forwarded client `project_id` into Gemini without `getProjectForInternalWorkspace` (image route already guarded). Unmerged PR #317. |
| Field daily logs | BROKEN RLS | Tenant-wide FOR ALL policy; PostgREST wipe of confirmed rows. Unmerged PR #347. |
| Notifications | PARTIAL | Created/listed/read + `notification_opened` (PR #369 LIVE). Delivered/acted not complete. |
| Telemetry | PARTIAL | login + notification_opened + some core actions. Growth rates must stay null. |
| AI runtime | PARTIAL | Health says configured. Canonical `--require-live` smoke **NOT TESTED** this session. |
| Billing | PARTIAL | Account-scoped architecture present; entitlement cutover still gated. |
| Legal | BLOCKED_EXTERNAL | Counsel drafts. |
| Stores | OWNER_GATE | TestFlight / Play. |
| ROMA | PARTIAL | Kernel + Operations Center read-only. Execution assurance schemas from PR #350 not on main. |
| Agentic | PARTIAL | Open unmerged PRs #315/#318 family; must not enable autonomous writes. |

## 4. First execution slice (started immediately)

Re-applied onto current main (file checkout, not giant PR merges):

- Video project authorization (from PR #317)
- Field daily log RLS + writer gates (from PR #347)
- Stakeholder self-reactivation trigger (from PR #351)
- Pending approvals include submitted reports (from PR #348)
- Project summary includes submitted reports (from PR #352)

Migrations **must be applied** on staging (then production) before those RLS verdicts can become PROVEN live. Repo presence alone is PARTIAL.

## 5. Machine-readable matrix

Canonical CSV: `docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv`

Columns: ID, DOMAIN, REQUIREMENT, ROADMAP_SOURCE, CURRENT_STATUS, CODE_EVIDENCE, LIVE_EVIDENCE, DEPENDENCIES, PRIORITY, BLOCKER_TYPE, ACCEPTANCE_CRITERIA, TEST, LIVE_TEST, VERDICT

Allowed verdicts only: PROVEN | PARTIAL | MISSING | BROKEN | BLOCKED_EXTERNAL | OWNER_GATE | DEFERRED_BY_DECISION

## 6. Explicit non-claims

- This audit does **not** certify 100% engineering implementation.
- Matching `buildStamp` with main does not prove all product flows.
- `aiConfigured=true` is not LIVE AI.
- Unmerged Cursor bugbot PRs are not production.
- Historical Phase 8 / 100% readiness docs dated 2026-08-* are snapshots.

## 7. Next DAG node after this PR

1. CI + non-author review of this security/ops slice.  
2. Apply the two new migrations on staging; negative PostgREST tests.  
3. AIS-OWNER-001 portal E2E (after live RLS).  
4. Customer iOS ADR + scaffold using Shared contracts.  
5. ROMA-VER-009 assurance graph schemas (advisory).
