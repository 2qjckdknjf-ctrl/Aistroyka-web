# Liquid Glass — Slice 1 — Content & Design Acceptance

Date: 2026-06-28

## Liquid Glass foundation present in working tree

- `apps/web/components/design/liquid-glass/` foundation components exist (`AppGlassRoot`, `LiquidGlass`, `GlassSurface`, `GlassNav`, `GlassLink`, etc.).
- `apps/web/styles/liquid-glass.css` provides `--lg-*` tokens consumed by `app/globals.css`.
- `apps/web/public/effects/glass-filter.svg` present.

## Public shell integration

- `app/layout.tsx` mounts `<AppGlassRoot />` globally.
- `app/[locale]/(public)/layout.tsx` renders `<PublicAmbientField />` + `<PublicLiquidGlassRoot />` and wraps header/main/footer in the glass shell.
- `PublicHeader` / `PublicFooter` use the glass nav (`GlassNav`, `GlassLink`).

## Homepage integration

- `PublicHomeContent.tsx` uses LG components: `PublicHeroCTA`, `PublicHeroLens`, `PublicHeroMetrics`, `PublicRevealGlassCard`, `PublicCTASection`, `PublicRelatedLinksSection`, `GlassLink`.
- Visible LG markers on the homepage via the public shell (ambient field, LG root, glass header/footer) and home hero/lens.

## CTA preservation (pilot-first)

`public.cta` (added, all locales):
- EN: Launch pilot / Contact us / Get presentation
- RU: Запустить пилот / Связаться с нами / Получить презентацию
- ES: Iniciar piloto / Contáctanos / Obtener presentación
- IT: Avvia pilota / Contattaci / Richiedi presentazione

No demo-first CTA restored. Existing main CTA keys were preserved (additive merge, main wins on conflicts).

## No fake numeric metrics

- The source branch's `MOCK_METRICS` (`500+`, `12K+`, `8K+`, `45K+`) was **removed**.
- Hero metric chips and the capability grid now render truthful qualitative labels from `public.homeMetrics` (`projectsMonitored` = "Project monitoring", etc. + `*Desc`).
- Scan of changed source for `MOCK_METRICS|500+|12K+|8K+|45K+|Request demo|Book demo`: only a non-rendered docstring comment in `CountUpText.tsx` describing the parser; no rendered fake metrics.

## i18n validity

- en/ru/es/it remain valid JSON.
- No languages deleted.
- Full-tree parity (`I18N_CHECK_ALL=1`) OK across ru/es/it vs en.
- Only `public.{home,homeMetrics,cta,nav,footer,layout}` namespaces received additive keys.

## Claims discipline

- No production GA claim.
- No "latest main deployed" claim.
- No "Liquid Glass live" claim.
- No deploy performed in this PR.
