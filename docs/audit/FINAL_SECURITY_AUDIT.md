# Final security audit (Phase 13)

**Roadmap:** Phase 13 — § 13.1 Security audit  
**Date:** 2026-05-07  
**Customer finance rule:** Owners/customers must not see internal contractor financial state (see mega-roadmap).

## 1. Tenant isolation

- **RLS:** Supabase migrations under `apps/web/supabase/migrations/`; tenant-scoped tables use `tenant_id` and member predicates.
- App layer: `TenantContext`, `requireTenant`, internal vs portal-only roles (`stakeholder` dashboard path blocks in `stakeholder-dashboard-paths`).

**Verdict:** **ARCHITECTURE SOUND** — regressions are **change-control** issues; review on every RLS-affecting migration.

## 2. Owner / customer vs internal surfaces

- Client portal and stakeholder flows use dedicated services (`client-portal`, portal API routes under `/api/v1/portal/`).
- Internal dashboard and manager APIs require internal roles; multiple route tests reject `stakeholder` (e.g. `dashboard/manager-actions`, `traceability`).

**Verdict:** **PASS** with ongoing route-level reviews for new `/api/v1/*` handlers.

## 3. Share token security

- Proof pack / share routes: service-role paths validated in dedicated tests (e.g. `app/api/v1/share/proof/[token]/route.test.ts`).
- Product docs: `docs/product/PHASE6_SHARE_LINK_SECURITY.md` (and related).

**Verdict:** **PASS** for implemented patterns — new share surfaces must reuse the same **token + shape** discipline.

## 4. System and admin routes

- System routes audited historically in live reports under `docs/audit/LIVE_SYSTEM_ROUTE_*`.
- Platform-owner gates must not be weakened when adding features.

**Verdict:** **VERIFY ON CHANGE** — no blanket “all routes audited” claim.

## 5. RLS verification

- Stakeholder helpers documented in `apps/web/lib/tenant/rls-stakeholder-predicates.test.ts` (intent vs SQL helpers).
- Full DB verification = migration review + optional Supabase advisors (see Supabase MCP guidance).

## P0 / P1

- **P0:** None identified in static audit.
- **P1:** Manual pen-test / third-party audit not in scope of this file; recommend before **serious** enterprise sales.

## References

- `docs/security/threat-model.md`, `data-flow.md`
- `docs/audit/SYSTEM_ROUTE_SECURITY_FINAL_VERIFICATION.md`
- `docs/security/PHASE2_OWNER_PORTAL_SECURITY_AUDIT.md` (historical)
