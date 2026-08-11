# Product Design Remediation Slice 02 — Implementation

**Date:** 2026-08-11

**Branch:** `design/product-design-remediation-slice-02-2026-08-11`

**Base SHA:** `7c6ff21fe1aedbd7708cebff3c6cde682fc851ff`

**Allowlist (Dima 2026-08-11):** `PD-P1-04`, `PD-P2-07`, `PD-P2-04`

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/221

**Implementation head (keyboard remediation):** `5dc848a0dd96923d74955ae0ca51bf65648805e8`

**Cloudflare exact-head gate:** cleared by authorized preview-only GitHub Re-run build `f79cd88d-24d3-4f15-ab4a-161a0be0121a` (SUCCESS → preview Version `9eed5e1e-…`; production traffic unchanged at `7c6ff21`). See evidence notes.

**PR merge / production deploy / Slice 03:** still not authorized.

## Scope

| ID | Surface | Change |
|----|---------|--------|
| PD-P1-04 | `/dashboard/projects/[id]` | Remove competing `ProjectSubnav`; keep one primary `tablist`; sync `?tab=` via `router.replace`; horizontal Arrow/Home/End keyboard activation on shared `Tabs` |
| PD-P2-07 | `/dashboard/ai` | Persistent non-LIVE readiness chip (`Badge` + tokens); never claim LIVE |
| PD-P2-04 | `/dashboard` + shell banner | Ops overview first; compact launch banner for returning partial progress; persistence key unchanged |

## Explicitly excluded

`PD-P1-02`, `PD-P1-05`, `PD-P1-06`, `PD-P2-03`, `PD-P2-05`, `PD-P2-06`, `PD-P2-08`, Slice 03, migrations, auth/RBAC redesign, password-reset, persona shell.

## Security / RBAC

No middleware, tenant isolation, route guards, API contracts, or billing changes.
