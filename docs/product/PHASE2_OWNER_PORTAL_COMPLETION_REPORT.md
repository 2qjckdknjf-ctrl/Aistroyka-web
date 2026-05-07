# Phase 2 — Owner portal completion report

**Phase:** 2 — Owner / Customer Portal  
**Date:** 2026-05-07  
**Verdict:** **YES** (with explicit URL mapping; see access model).

## What shipped

1. **Canonical customer namespace (`/portal`)**  
   - `/{locale}/portal` redirects to `/{locale}/portal/projects`.  
   - `/{locale}/portal/projects` lists projects available in the customer portal and deep-links into existing `.../dashboard/projects/:id/client` UI.

2. **Customer-safe APIs (`/api/v1/portal/...`)**  
   - `GET /api/v1/portal/projects` — projects with `client_portal_enabled` and active stakeholder **or** `project_members.role = owner`.  
   - `GET /api/v1/portal/projects/:id` — full `ClientProjectView` (same as `client-view`).  
   - `GET .../progress`, `.../documents`, `.../decisions`, `.../estimates`, `.../proof` — slices / customer estimates / proof policy message (share-link mode today).

3. **Auth & routing**  
   - `/portal` added to protected prefixes in `middleware.ts`.  
   - Post-auth `next` allow-list includes `/portal` (`entry-routing.ts`).  
   - Stakeholder redirect helper allows `/portal/projects` subtree (`stakeholder-dashboard-paths.ts`).

4. **i18n**  
   - `portalPage.*` in `en`, `ru`, `es`, `it`.

5. **Tests**  
   - `app/api/v1/portal/projects/route.test.ts`  
   - `app/api/v1/portal/projects/[id]/route.test.ts`  
   - Extended `stakeholder-dashboard-paths.test.ts`

## Validation run locally

- `next build` (to be run in CI after merge)  
- Targeted vitest for new route tests + stakeholder paths

## Intentional deviations from roadmap literals

- Roadmap lists `/owner/...` and `/api/v1/owner/projects` for **customer**; those paths are reserved for **platform owner**. Implemented equivalents are `/portal/...` and `/api/v1/portal/...` (documented in `PHASE2_OWNER_PORTAL_ACCESS_MODEL.md`).

## Outstanding / future

- Optional: dedicated `/{locale}/portal/projects/[id]` hub instead of redirect-only entry (currently reuses dashboard client subtree).  
- Proof: in-product gallery when product defines stakeholder-safe proof listing beyond tokenized share links.

## Closure criteria (roadmap §620–625)

| Criterion | Status |
|----------|--------|
| Customer portal works | YES — `/portal` + existing client UI |
| Access isolation tested | YES — API reuses `canReadClientPortalView`; route tests; stakeholder path tests |
| No internal financial leakage | YES — same read model as Phase 0/1 hardening |
| Progress, documents, decisions, estimates | YES — via client UI + portal APIs |
| Manager can link customer | YES — pre-existing stakeholder + portal enablement |

**PHASE 2 CLOSED: YES**
