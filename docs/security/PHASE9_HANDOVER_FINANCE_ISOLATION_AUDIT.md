# Phase 9 — Handover finance isolation audit

## Customer surfaces

- **Owner/stakeholder** `GET /api/v1/projects/:id/handover/pack` uses `buildOwnerHandoverPack` → `getClientProjectView` + defect list items. No queries against internal cost tables or manager cost fields.
- **Preview page** renders only API payload (sections, handover summary from public handover fields).

## Manager surfaces

- Manager payload includes **`readiness`** from `computeHandoverReadiness`, which references *operational* blockers (documents, change orders, milestones, open punch blockers, etc.). This is manager-only in the UI branch (`audience === "manager"`).
- Pack **sections** for managers are intended to mirror the customer view (or minimal fallback). They intentionally avoid internal finance vocabulary.

## Blockers list

`handover-readiness.ts` does **not** add “internal budget not finalized” as a customer-visible string in the pack; workload may still surface internal budget signals elsewhere (separate concern, manager dashboard).

## Verdict

**PASS** for v1 pack API and preview: owner path is portal-scoped and finance-safe; manager path separates readiness blockers from section summaries.
