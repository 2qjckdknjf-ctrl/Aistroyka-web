# B5 — Closure Sprint inventory — Aistroyka

**Date:** 2026-03-16  
**Purpose:** Truthful rollup of B1, B2.2, B3, B4 for final validation.

---

## B1 — Architecture drift audit

| | |
|--|--|
| **Goal** | Inventory packages, API surface, env scatter, duplicate trees; classify drift without mass refactor. |
| **Done** | `CORE_B1_ARCHITECTURE_DRIFT_AUDIT.md`: DRIFT-001..006 documented; api-client disconnected, dual `/api` vs `/api/v1`, root lib, audit_* trees, env model (later B2.2). |
| **Not done** | No client-wide migration to v1 only; no api-client delete; no contracts-openapi wiring; structural drift remains **documented**. |
| **Truth status** | **PARTIAL** — audit is authoritative; drift items are **open as engineering backlog**, not closed in code. |

---

## B2.2 — Env governance wording alignment

| | |
|--|--|
| **Goal** | Align documented rule with real `process.env` usage in `apps/web`. |
| **Done** | `lib/config/index.ts` (+ related) states canonical declaration + allowed exceptions; `CORE_B2_2_ENV_GOVERNANCE_AUDIT.md` lists direct-read sites by category. |
| **Not done** | Broad centralization of provider/domain env reads into config helpers — **deferred** (explicit in B2.2 §D). |
| **Truth status** | **FULL for governance wording**; **PARTIAL for centralization** (intentional). |

---

## B3 — Boundary cleanup (soft pass)

| | |
|--|--|
| **Goal** | Classify api-client, root `lib/`, WorkerLite tails; document truth. |
| **Done** | B3 doc set + `CORE_B3_POST_AUDIT.md`: api-client = SDK-side PARTIAL; root lib = legacy duplicate PARTIAL; WorkerLite = no active web code FULL for that slice. |
| **Not done** | api-client not in workspaces; root `lib/` not removed. |
| **Truth status** | **PARTIAL / accepted** per sprint charter. |

---

## B4 — Naming normalization

| | |
|--|--|
| **Goal** | Canonical names, legacy containment, safe doc/comment/metadata fixes. |
| **Done** | `CORE_B4_CANONICAL_NAMING.md`, inventory, mobile/package docs; `SYSTEM_REPOSITORY_MAP` tree corrected; release matrix, ADR-014, phase headers, api-client `description`, design comments. |
| **Not done** | Bulk rename of archive reports; npm package `name` fields; native bundle/display. |
| **Truth status** | **PARTIAL / accepted** on authoritative surfaces; archive drift remains. |
