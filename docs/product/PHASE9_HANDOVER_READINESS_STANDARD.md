# Phase 9 — Handover readiness standard

## Goals

1. **Customer-safe handover pack** — aggregated visibility of progress, milestones, shared documents, commercial-facing requests, punch list, and handover status. No internal budget, margin, or cost analytics.
2. **Manager readiness** — explicit blockers (`HandoverBlocker`) before advancing lifecycle states; internal finance is *not* a customer-facing blocker (see isolation audit).

## Current implementation (v1)

| Piece | Location |
|-------|-----------|
| Blocker computation | `lib/domain/project-handover/handover-readiness.ts` → `HandoverReadinessResult` |
| Pack payload (sections + audience) | `lib/domain/project-handover/handover-pack.service.ts` |
| Types | `handover-pack.types.ts`, `project-handover.types.ts` |
| API | `GET /api/v1/projects/:id/handover/pack` (manager vs stakeholder via policy) |
| UI preview / print | `/dashboard/projects/:id/handover/pack` |

## Pack sections (customer-aligned)

Derived from `ClientProjectView` when portal is enabled; otherwise managers see a **minimal** fallback (progress + defects + note to enable portal).

## Export

v1 uses **browser print** on the preview page. Dedicated PDF generation is a later hardening step.

## Versioning

Treat pack JSON as backward-compatible additive; clients should ignore unknown section `id` values.
