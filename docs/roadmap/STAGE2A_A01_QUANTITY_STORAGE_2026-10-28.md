# Stage2a A01 — immutable quantity storage

2026-10-28. First storage adapter for C04 `calculateQuantity` / pilot WorkSpecification.

## Scope (this slice)

| Piece | Status |
|---|---|
| `quantity_work_specifications` | Immutable catalogue binding per project/work_code/revision (no prices) |
| `quantity_input_snapshots` | Immutable validated `QuantityRequest` + sha256 `request_hash` |
| `quantity_calculation_revisions` | Immutable C04 result bound to a snapshot |
| RLS | `is_internal_tenant_writer_for_tenant` select/insert; no update/delete policies |
| Immutability triggers | Reject payload/identity updates; create a new revision instead |
| API | `POST/GET /api/v1/projects/:id/quantities/snapshots` (manager write; internal read) |
| Customer/portal/owner finance | Not exposed; commercial keys rejected on write |

## Out of scope (later)

- A02 Manager geometry UI
- A03 Worker field capture adapters
- A04 human acceptance of measured quantities
- A05 commercial line bindings / prices
- C03 evidence/calibration adapter depth
- C05 independent real-measurement acceptance

## Finance boundary

Tables and DTOs intentionally omit unit price, cost, margin, markup, and subcontractor amounts. `assertNoCommercialFields` fails closed on smuggled keys. Portal/stakeholder roles cannot read these tables via RLS.

## Apply

Migration: `apps/web/supabase/migrations/20261028160000_stage2a_a01_quantity_storage.sql`  
Apply to live project **AISTROYKA** (`vthfrxehrursfloevnlp`) after merge via governed SQL path; do not invent parallel projects.
