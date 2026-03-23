# Phase 5 — Product completion layer (inventory)

**Date:** 2026-03-23  
**Tracks:** [AISAA-13](/AISAA/issues/AISAA-13)  
**Parent:** [AISAA-1](/AISAA/issues/AISAA-1)  
**Depends on (runtime truth):** [AISAA-11](/AISAA/issues/AISAA-11) — live proof for tenant/RLS-sensitive flows may stay **OPEN** until unblocked; see [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md).

## Purpose

Map **manager control center**, **customer/owner surfaces**, **unified workflow narrative**, and **commercial/billing** touchpoints as they exist in `apps/web`, with explicit crosswalk to Phase 1D documents closure and Phase 4 intelligence surfaces.

---

## 1. Manager dashboard — navigation shell

Primary shell: `apps/web/components/DashboardShell.tsx` (`SIDEBAR_LINKS`).

| Surface | Route (locale-prefixed in app) | Role |
|---------|-------------------------------|------|
| Overview | `/dashboard` | Entry after auth; `OnboardingGate` / plan-fit orchestration |
| Projects | `/dashboard/projects` | Project list → detail |
| Tasks | `/dashboard/tasks` | Tenant task views |
| Workers | `/dashboard/workers` | Worker roster / ops |
| Reports | `/dashboard/reports` | Report list / detail |
| Approvals | `/dashboard/approvals` | **Daily reports queue only** (not project documents) |
| Uploads | `/dashboard/uploads` | Media / upload flows |
| Devices | `/dashboard/devices` | Device registry |
| AI | `/dashboard/ai` | Copilot / AI entry (Phase 2 closure: partial — see `PHASE2_COPILOT_*`) |
| Alerts | `/dashboard/alerts` | Alert surfacing |
| Notifications | `/dashboard/notifications` | Unread / read-all APIs under `/api/v1/notifications/*` |
| Billing | `/billing` | Tenant billing UI + return/cancel pages |

**Admin** (gated): `/admin/push`, `/admin/jobs`; broader admin surfaces exist under `app/[locale]/(dashboard)/admin/` (leads, ops, billing pilot folders in repo).

---

## 2. Manager — project control center (detail)

Anchor: `DashboardProjectDetailClient.tsx` + panels (documents, schedule, issues, etc.).

| Concern | Implementation notes |
|---------|----------------------|
| Health / summary | `GET /api/v1/projects/:id/summary` |
| Action queue | `GET .../attention?viewer=manager` |
| Activity | `GET .../timeline` |
| Documents | `ProjectDocumentsPanel` + `PATCH .../documents/:id` (see Phase 1D) |
| Issues | `ProjectIssuesPanel` + `GET .../issues` |
| Owner handoff | Link to `/dashboard/projects/[id]/owner` from project detail |

Portfolio / cross-project command: `/portfolio` + `PortfolioCommandViewClient` + `GET /api/v1/portfolio/summary` (Phase 4).

---

## 3. Customer / owner surface

| Item | Location |
|------|----------|
| Route | `app/[locale]/(dashboard)/dashboard/projects/[id]/owner/page.tsx` |
| Client | `OwnerViewClient.tsx` |
| Product spec (may predate code) | `docs/product/OWNER_MODULE_MVP.md` |

**Data calls (representative):** `GET /api/v1/projects/:id`, `.../summary`, `.../attention?viewer=owner`, `.../timeline`, `.../milestones`, `.../issues`, `.../documents`, `.../reports`, `.../media`, `POST .../documents/:documentId/decision`.

**Access model:** APIs for `viewer=owner` use `requireProjectOwner` where applicable; migration `20260323000000_project_members_owner_role.sql` introduces project-scoped **owner** role (see [docs/project-membership-access-hardening.md](../project-membership-access-hardening.md)). This is **ahead of** the MVP doc line “no dedicated owner role” — treat the **code + access helpers** as current engineering truth.

---

## 4. Unified workflow narrative (product shape)

| Narrative thread | Repo reality |
|------------------|--------------|
| “One approvals inbox” | **Split:** `/dashboard/approvals` = **reports**; project **documents** reviewed inside project UI |
| Manager document review parity with reports | **Partial** — no request-changes + note on manager PATCH path ([PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md](./PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md)) |
| Owner decisions on documents | **E2E in code** via `POST .../decision` + owner UI |
| Intelligence / attention | Shared attention model; manager vs owner viewers ([PHASE4_INTELLIGENCE_INVENTORY.md](./PHASE4_INTELLIGENCE_INVENTORY.md)) |

---

## 5. Commercial / billing touchpoints

| Area | Route / module | Notes |
|------|----------------|-------|
| Billing readiness overview | `GET /api/v1/billing/overview` | `billing-readiness.service` — status/plan messaging without implying paid checkout |
| Checkout session | `POST /api/v1/billing/checkout-session` | Stripe via `createCheckoutSession`; **503** if admin client or Stripe not configured |
| Portal | `GET/POST .../billing/portal` | Customer portal when configured |
| Webhooks | `app/api/v1/billing/webhooks/stripe/route.ts`, `webhook/route.ts` | Event ingestion (see architecture docs under `docs/architecture/BILLING_*`) |
| Sandbox | `.../billing/sandbox/*` | Explicit **no real payment** paths for pilot |
| Checkout readiness | `GET .../billing/checkout-readiness` | Gating / diagnostics |
| Admin billing pilot | `app/[locale]/(dashboard)/admin/billing-pilot/` | Operator-facing pilot UI (repo) |
| Plan fit / upgrade copy | `/api/v1/plan-fit/*`, onboarding components | Entitlement surfacing adjacent to commercial story |

**Contact → lead → admin** is covered in Phase 1 live work ([AISAA-7](/AISAA/issues/AISAA-7)); not re-proven here.

---

## 6. Cross-phase references

| Phase | Artifact |
|-------|----------|
| 1D manager documents | [PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md](./PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md) |
| 3 live / health | [PHASE3_LIVE_MATRIX.md](./PHASE3_LIVE_MATRIX.md), [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md) |
| 4 intelligence | [PHASE4_INTELLIGENCE_INVENTORY.md](./PHASE4_INTELLIGENCE_INVENTORY.md) |
| MVP roadmap (Phase 5 row) | [MVP_EXECUTION_ROADMAP.md](./MVP_EXECUTION_ROADMAP.md) §2 R4 / §3 |

---

## 7. Live vs repo scope

This inventory is **repo-first**. End-to-end verification on production/staging for RLS-heavy paths is **OPEN** while [AISAA-11](/AISAA/issues/AISAA-11) remains blocked — do not infer green from code alone for those flows.
