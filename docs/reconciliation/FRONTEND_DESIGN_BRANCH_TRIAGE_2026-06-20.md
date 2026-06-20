# Frontend / Design Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## release/web-pilot-rc

- Ref reviewed: `origin/release/web-pilot-rc`
- Ahead/behind: 23 ahead, 0 behind
- Last commit: `9d6a7812` — `design: apply Liquid Glass across web app surfaces`
- Changed file count: 269

### Visible UI Changes
- Public site changes: YES. Includes redesigned public pages for about, AI construction control, AI demo, API, contact, copilot, enterprise, FAQ, features, implementation, integrations, mobile, partners, platform, pricing, security, solutions, workflows, cases, and docs.
- Dashboard changes: YES. Includes admin AI, billing pilot, governance, trust, billing, project panels, dashboard project lists, owner/client portal panels, support, portfolio, team, and project upload/analysis surfaces.
- Admin changes: YES. Includes AI runtime/requests/security and governance/trust/admin surfaces.
- Owner/stakeholder changes: YES. Includes `(owner)` layout and owner console plus client portal surfaces.
- Logo/brand assets: PARTIAL/LIKELY through public/design component changes.
- Design system changes: YES. Includes Liquid Glass components and public components.
- Navigation changes: YES. Includes public header/footer and route/layout changes.

### API / Compatibility
- Uses old APIs or new `/api/v1`: MIXED. The branch touches `/api/v1` AI routes but also many dashboard/client surfaces that must be checked for API compatibility.
- Conflicts with current main: LIKELY. It is ahead of main and broad across product surfaces.
- Better than main or stale: Likely newer visible frontend/design work, not stale.
- Would merging restore visible missing frontend work: YES, but only if selected carefully.

### Decision
- Risk: P0.
- Decision: `cherry_pick_later`.
- Integration method: selected frontend/design slices only, after API, auth, role, and customer finance isolation review.
- Do not full-merge because the branch also touches AI/admin/API/migration-sensitive paths.

## design/liquid-glass-public-shell-lg2a

- Ref reviewed: `origin/design/liquid-glass-public-shell-lg2a`
- Ahead/behind: 38 ahead, 5 behind
- Last commit: `68be705a` — `docs: add final LG branch readiness report`
- Changed file count: 349

### Visible UI Changes
- Public site changes: YES. Contains Liquid Glass public site redesign for marketing pages and shared public components.
- Dashboard changes: PARTIAL. Includes admin AI surfaces despite the branch name being public-shell oriented.
- Admin changes: YES. Includes AI admin Expert Review and Training Consent pages.
- Owner/stakeholder changes: UNKNOWN/PARTIAL.
- Logo/brand assets: YES/PARTIAL through design/public assets and styles.
- Design system changes: YES. Includes `apps/web/components/design/liquid-glass/*`, `apps/web/lib/design/*`, `apps/web/styles/liquid-glass.css`, `apps/web/app/design-tokens.css`, and globals.
- Navigation changes: YES. Includes public layout/header/footer.

### API / Compatibility
- Uses old APIs or new `/api/v1`: Includes `/api/v1` AI feedback/transcribe/Copilot/tenant AI routes.
- Conflicts with current main: LIKELY. It overlaps with `release/web-pilot-rc` and AI branches.
- Better than main or stale: Not stale, but likely superseded in parts by `release/web-pilot-rc`.
- Would merging restore visible missing frontend work: PARTIAL. It is a useful source for Liquid Glass public components, but not the preferred full source because it contains AI/migration scope too.

### Decision
- Risk: P0.
- Decision: `manual_review_again`.
- Integration method: compare against `release/web-pilot-rc`; extract only design components/pages that are not already represented there.
- Do not full-merge.

## feature/unified-product-design-certification

- Ref reviewed: `feature/unified-product-design-certification`
- Ahead/behind: 50 ahead, 5 behind
- Last commit: `38e0d705` — `docs: add RBAC architecture audit`
- Changed file count: 721

### Visible UI Changes
- Public site changes: YES/PARTIAL.
- Dashboard changes: YES/PARTIAL.
- Admin changes: YES/PARTIAL.
- Owner/stakeholder changes: UNKNOWN/PARTIAL.
- Logo/brand assets: YES/PARTIAL.
- Design system changes: YES.
- Navigation changes: YES/PARTIAL.
- Mobile design changes: YES. This branch includes iOS and Android Liquid Glass design work.

### API / Compatibility
- Uses old APIs or new `/api/v1`: MIXED/UNKNOWN. It touches web, mobile, AI, backend, migrations, and docs.
- Conflicts with current main: LIKELY due to 721 changed files and mobile build config changes.
- Better than main or stale: Not stale, but too broad and likely combines work from narrower branches.
- Would merging restore visible missing frontend work: POSSIBLY, but it would also drag mobile, AI, RBAC/docs, and build config changes.

### Decision
- Risk: P0.
- Decision: `manual_review_again`.
- Integration method: use as evidence/source branch only. Prefer narrower branches (`release/web-pilot-rc` for web, `release/mobile-pilot-rc` for mobile) when selecting changes.
- Do not full-merge.

## Frontend/Design Conclusion
- Strongest candidate for missing visible web/frontend work: `release/web-pilot-rc`.
- Best integration method: selected commits or file groups, not full branch merge.
- Required checks before applying any selected frontend/design changes:
  - i18n bundles for en/ru/es/it
  - route reachability for public/dashboard/owner/client surfaces
  - auth/role gates
  - customer finance isolation
  - `/api/v1` compatibility
  - lint/typecheck
  - web build and Cloudflare build
