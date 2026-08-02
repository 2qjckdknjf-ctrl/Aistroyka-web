# First-client launch — scope lock (STAGE 0)

> **SUPERSEDED for first-pilot Android scope (2026-07-03 / reconfirmed 2026-07-30).**
> Active program policy is **P3 Option A — defer Android** (`docs/mobile/P3_ANDROID_DEFER_DECISION.md`, Phase 6 closure).
> This 2026-03-24 lock remains a historical STAGE-0 snapshot. Do **not** treat its “Android mandatory” line as current first-pilot authorization.

**Program:** Controlled first-client delivery (Aistroyka)
**Date locked:** 2026-03-24
**Business constraint (external):** First client waiting; **1-week delivery pressure**; **Android + iOS** both mandatory for Manager and Worker; operational contour **Worker → report/media → AI analysis → Manager review/action**.

## 1. Strategic override (authoritative for execution)

- Historical docs that deferred Android or treated it as foundation-only are **not** the current directive.
- **Android must become a real launch-critical product surface**, not a placeholder.
- This program does **not** expand customer module, B2B2C, budget/cost, broad documents platform, or speculative AI architecture.

## 2. In-scope (launch-critical operational core)

| Area | Scope |
|------|--------|
| **Worker (mobile)** | Login, role-appropriate access, project/task/report context, create report, attach media, upload session + finalize, submit report, visible state, sync/bootstrap/changes where architecture supports it |
| **Manager (mobile)** | Login, visibility of projects/reports/tasks, report detail, media preview, AI summary/evidence/risk where API exposes it, **approve / reject / request changes**, pending attention visibility |
| **Backend / web** | Auth + tenant + role truth, report persistence, media pipeline, AI processing hooks, manager review persistence, cross-platform consistency for the contour above |
| **Validation** | Strongest repo-supported checks per stage; smoke/pilot paths where documented |

## 3. Out of scope (explicit deferrals)

- Customer module, broad B2B2C surfaces
- Budget/cost expansion
- Broad documents/contracts platform
- Giant redesign or speculative refactors
- Unrelated AI expansion beyond what the contour needs
- Feature parity beyond launch-critical flows
- Nonessential UX polish

## 4. Product truth vs must-have list (critical gaps identified in repo)

The program’s bullet list includes **video** and **text comment** on the Worker side. **Repo truth:**

| Requirement | Backend / domain | iOS Worker | Android |
|-------------|------------------|------------|---------|
| Photos + upload pipeline | Supported (`worker/report/*`, `media/upload-sessions/*`) | **Implemented** (before/after still images via operation queue / JPEG upload) | **None** |
| Video | Media finalize accepts mime/size; no Worker-specific blocker found in types | **Not implemented** — upload path is UIImage → JPEG only | **None** |
| Worker free-text comment | `worker_reports` + `report.service` focus on day/task/media; **no dedicated worker comment field** in inspected types | **No comment field in report UI** | **None** |

**Resolution for later stages:** Either (a) treat “comment” as **deferred** with explicit client agreement, or (b) add **schema + API + four clients** — not assumed closed in this lock.

## 5. Stage gate (STAGE 0)

| Deliverable | Status |
|-------------|--------|
| Truthful launch matrix | `FIRST_CLIENT_LAUNCH_MATRIX.md` |
| Blocker register | `FIRST_CLIENT_BLOCKER_REGISTER.md` |
| This scope lock | This document |

**Rule:** No broad implementation work until this lock and blocker truth are accepted. Targeted spikes allowed only if explicitly scoped to remove a **P0** blocker.

## 6. Hard closure criteria for STAGE 1 (preview)

STAGE 1 (Android Worker rescue) may close only when:

1. Android Worker is no longer a stub: real auth, config, and **calls to actual `/api/v1` worker contracts** for the report pipeline.
2. Documented validation (`STAGE1_ANDROID_WORKER_VALIDATION.md`) has been run; failures triaged.
3. Post-audit (`STAGE1_ANDROID_WORKER_POST_AUDIT.md`) answers FULLY / PARTIAL / OPEN + P0–P2 and **YES/NO** for next stage.

---

*Evidence basis: repository inspection 2026-03-24 (Android Kotlin sources, iOS Swift sources, `apps/web` API routes and report domain, `docs/final/PHASE6_MOBILE_INVENTORY.md`).*
