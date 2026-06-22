# Dashboard Nav External Reference Review — 2026-06-20

## `release/web-pilot-rc`
- Useful nav ideas:
  - richer DashboardShell/Nav updates
  - project/client/owner surface discoverability
  - public/dashboard visual polish
- Risky parts:
  - broad branch with public redesign, dashboard changes, auth layout, API-adjacent and AI-adjacent changes
  - cannot be merged or copied wholesale
- Unsafe role exposure:
  - owner/client/customer panels must be checked for customer finance isolation
- AI/admin contamination:
  - contains AI admin panel changes; must not be included in nav slice
- Recommendation:
  - best reference for nav UX ideas, manual reimplementation only

## `design/liquid-glass-public-shell-lg2a`
- Useful nav ideas:
  - public/design navigation polish and Liquid Glass patterns
- Risky parts:
  - includes AI Expert Review/Training Consent admin pages
- Unsafe role exposure:
  - not a dashboard role model source
- AI/admin contamination:
  - yes
- Recommendation:
  - design-only reference later, not for this nav slice

## `feature/unified-product-design-certification`
- Useful nav ideas:
  - broad product/design certification references
- Risky parts:
  - very broad branch crossing web, mobile, AI, docs, API
- Unsafe role exposure:
  - unknown without deep review
- AI/admin contamination:
  - yes
- Recommendation:
  - reference only; do not source implementation from it

## Summary
- Use `release/web-pilot-rc` as the primary reference.
- Do not port external code.
- Do not include AI/admin Flywheel or customer/stakeholder finance links.
