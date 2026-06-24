# Issue #113 — Safe Next Slice (exactly one)

**Date:** 2026-06-24  
**Baseline `main`:** `0d26254bd59282c337b49063db028ff50a2d1e1e`

## Selected slice

**Title:** Public primary CTA copy alignment (pilot-first, i18n-only)

**Type:** copy-only (i18n message bundles)

**Rationale:** Lowest-risk design/public improvement after PRs #120–#134. Addresses P1 stale "Request Demo" messaging without layout, CSS, Liquid Glass, routing, or auth changes. All affected CTAs already route to `/contact` or existing public pages — no href changes required if copy is aligned to intent (pilot / contact).

## Allowed files

- `apps/web/messages/en.json`
- `apps/web/messages/ru.json`
- `apps/web/messages/es.json`
- `apps/web/messages/it.json`

## Target keys (minimum)

| Key | Current (EN) | Proposed direction |
|-----|--------------|-------------------|
| `public.nav.requestDemo` | Request Demo | **Contact us** (header/mobile; href `/contact`) |
| `public.home.finalCtaButton` | Request Demo | **Launch pilot** (href `/contact`) |
| `public.home.ctaDemo` | Request Demo | **Launch pilot** |
| `public.home.finalCtaSubtitle` | Request a demo or start with a trial. | Pilot-first wording; no false GA |
| `public.home.pricingTeaserSubtitle` | …Request a demo… | Contact / pilot wording |
| `public.pricing.bookDemo` | Book demo | **Get presentation** or contact wording |
| `public.enterprise.ctaDemo` | Enterprise demo | Contact / presentation wording |

**Note:** If hero and header must differ (`Launch pilot` vs `Contact us`) while sharing one key today, the **follow-up** slice may add `public.nav.contactUs` + one-line component key swap in `PublicHeader.tsx` only. This slice keeps **i18n-only** by using unified pilot/contact copy per key usage audit.

**Keep unchanged:** `public.nav.aiDemo`, `public.aiDemo.*` (interactive demo page name), dashboard/auth copy.

## Forbidden files

- `apps/web/app/[locale]/(public)/**` (except if a later slice adds key splits — not in this slice)
- `apps/web/components/public/**`
- `apps/web/app/globals.css`, `design-tokens.css`, `liquid-glass.css`
- `apps/web/components/design/**`
- `apps/web/middleware.ts`, auth/RBAC, API routes
- `ios/**`, `android/**`
- `design/liquid-glass-*` branch merges
- migrations, env, deploy config

## Acceptance criteria

1. No key remains with stale primary "Request Demo" / "Запросить демо" on main public CTAs listed above.
2. EN/RU/ES/IT updated together for every changed key.
3. No production GA, certification, or 9.5/10 claims introduced.
4. `/ai-demo` page title remains clearly a demo/simulator.
5. Cabinet/mobile header CTAs unchanged (`cabinet`, `login`).
6. `bun run i18n:check` PASS.
7. Full suite PASS (1546/1546).
8. `bun run build` + `bun run cf:build` PASS.

## Validation commands

```bash
bun install --frozen-lockfile
bun run i18n:check
bun run lint
bun run test -- --run
bun run build
bun run cf:build
```

## Rollback plan

Revert the single i18n PR; no schema, route, or runtime changes to undo.

## Explicitly deferred (not this slice)

- Homepage `MOCK_METRICS` removal (requires `PublicHomeContent.tsx`)
- Liquid Glass visual polish / hero redesign
- Trust strip rewrite
- New public CTA tests
- Logo/asset replacement
- Dashboard or portal design
