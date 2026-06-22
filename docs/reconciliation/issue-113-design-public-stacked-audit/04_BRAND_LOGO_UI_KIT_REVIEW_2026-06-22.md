# Brand / Logo / UI Kit Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Brand Assets Reviewed

Current visible brand implementation:

- `apps/web/components/brand/Logo.tsx`
- `apps/web/public/brand/aistroyka-logo.png`
- `apps/web/public/brand/aistroyka-icon.png`
- `apps/web/public/brand/wordmark/aistroyka-wordmark.png`

Additional SVG assets:

- `apps/web/public/brand/aistroyka-logo.svg`
- `apps/web/public/brand/aistroyka-icon.svg`
- `apps/web/public/brand/logo/aistroyka-logo-full.svg`

No assets were modified in this audit.

## Current UI Kit Assumptions

Current baseline includes:

- `apps/web/app/design-tokens.css`
- `apps/web/app/globals.css`
- `components/ui/*`
- `components/public/*`
- token classes using `--aistroyka-*`

It does not include the full external Liquid Glass component kit from the design branches.

## Design Branch UI Kit Additions

`design/liquid-glass-public-shell-lg2a` adds:

- `components/design/liquid-glass/*`
- `lib/design/liquid-glass.ts`
- `styles/liquid-glass.css`
- `public/effects/glass-filter.svg`
- public glass page components

These are useful references, but they are not isolated from AI/runtime branch content and should not be merged wholesale.

## Brand Kit Gaps

Gaps before a future brand/design PR:

- Confirm PNG/SVG source of truth.
- Confirm favicon/app icon/OG image mapping.
- Confirm logo dimensions in public header, dashboard shell, auth screens, and mobile contexts.
- Confirm dark/light contrast and reduced-motion behavior.
- Confirm no duplicated obsolete assets remain after any future replacement.

## Asset Risks

Risks in a design PR:

- replacing logo paths used by `next/image`
- breaking unoptimized logo rendering
- changing header height and causing mobile nav regressions
- adding heavy SVG/filter effects without performance tests
- introducing mismatched locale/metadata images

## Verdict

Brand/logo/UI kit changes are safe only as a separate tiny asset/token PR with visual QA. No asset replacement should happen as part of a broad Liquid Glass merge.
