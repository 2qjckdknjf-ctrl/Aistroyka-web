# Phase 8 — Punch list / defects (report)

**Date:** 2026-05-07  
**Roadmap:** PHASE 8 — PUNCH LIST / DEFECTS

## Summary

| Criterion | Status |
|-----------|--------|
| Defects CRUD + workflow | Implemented (`lib/domain/defects`, REST routes) |
| Manager UI | Implemented |
| Worker/stakeholder flow | Stakeholder create + transitions where policy allows |
| Photos / severity | Migration + types + repository support added (`20260507193000_*`) |
| Blocking items → handover readiness | `computeHandoverReadiness*`, `defectRepo.countBlockingOpen` |
| Owner-safe list/detail | Public defect shape without internal assignee id in list |
| Manager workload / handover signals | Workload inbox includes blocking defects and handover blockers |

## Deliverables

- `docs/product/PHASE8_PUNCH_LIST_DOMAIN.md` (this folder)
- `docs/product/PHASE8_PUNCH_LIST_REPORT.md` (this file)

## Verification

- `bun run --cwd apps/web test lib/domain/defects/defects.service.test.ts`
- Apply DB migrations in target Supabase (including optional severity/photo columns).

## Verdict

**YES** — punch list is implemented as `project_defects` with owner and manager surfaces; roadmap naming `punch_items` is documented as an alias.
