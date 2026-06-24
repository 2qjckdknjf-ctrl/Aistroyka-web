# Issue #113 — Forbidden Design/Public Actions

**Date:** 2026-06-24

## Branch merge forbidden (DO NOT MERGE broadly)

| Branch | SHA (remote) | Reason |
|--------|--------------|--------|
| `design/liquid-glass-public-shell-lg2a` | `68be705a` | Broad public UI + LG kit; AI routes/migrations in branch history |
| `design/mobile-liquid-glass` | — | Operator-forbidden; mobile design merge |
| `feature/unified-product-design-certification` | — | ~721 files; web/mobile/AI/docs/RBAC |
| `cursor/aistroyka-system-maturity-7957` | `63d9f26f` | Architecture maturity; 9.5/10 rejected; auth/sync/migrations |
| `audit/issue-113-design-public-stacked-audit-2026-06-22` | `6ece0d5d` | Stale-base docs branch; use this follow-up instead |
| Any old public/design branch without fresh rebase + small-slice audit | — | Stale merge risk |

## Runtime / product forbidden

- Broad Liquid Glass shell swap on `main`
- Global CSS/token migration (`liquid-glass.css`, full design system rewrite)
- Public layout / middleware / routing changes without security review
- Auth, RBAC, owner/customer portal design changes
- Mobile app design merge (`ios/`, `android/`)
- Backend or API changes
- Supabase migrations or live data changes
- Deploy or staging/production smoke (unless operator-approved separately)
- Claiming latest `main` is deployed without buildStamp evidence
- Public **production GA** or **general availability** claims
- Accepting external **architecture 9.5/10** certification on public surfaces
- Exposing internal contractor financial state on public/customer surfaces (mega-roadmap rule)

## Process forbidden

- Self-approve or bypass branch protection
- Broad stale branch resurrection after archival (#131)
- Mass doc rewrites outside scoped reconciliation dirs

## Allowed next step only

Single small slice per `02_SAFE_NEXT_SLICE_2026-06-24.md` — **i18n public CTA copy alignment** — with non-author APPROVED protected merge.
