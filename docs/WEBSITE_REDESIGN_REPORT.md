# Website Redesign Report

Design system implementation for AISTROYKA — modern AI SaaS aesthetic.

## Pages Updated

| Page | Changes |
|------|---------|
| Homepage | Hero with logo, gradient glow, dark theme, new CTAs |
| Public layout | Dark gradient background |
| Header | 64px, glass backdrop, dark theme |
| Footer | Dark theme, updated typography |
| Metrics, modules, roles, AI, mobile, pricing, CTA sections | Dark theme, card hover, yellow accent |

## Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| design-tokens | lib/design/*.ts | TypeScript token exports |
| AIInsightCard | components/ui/AIInsightCard.tsx | AI insight cards with glow |
| StatCard | components/ui/StatCard.tsx | Metric display |
| Panel | components/ui/Panel.tsx | Glass panel |
| Icon | components/ui/Icon.tsx | Lucide icon wrapper |

## Design Tokens

| Category | Location | Key values |
|----------|----------|------------|
| Colors | design-tokens.css | ai-white, ai-yellow, ai-pink, ai-dark, bg-main, bg-card |
| Typography | layout.tsx, design-tokens.css | Inter, Space Grotesk |
| Spacing | design-tokens.css | 4pt grid |
| Radius | design-tokens.css | radius-main 12px |
| Shadows | design-tokens.css | e1–e4, glow |

## Files Modified

- `apps/web/app/design-tokens.css` — Dark theme palette, new variables
- `apps/web/app/globals.css` — :root variables, hero-glow animation
- `apps/web/app/layout.tsx` — Inter + Space Grotesk, themeColor
- `apps/web/app/[locale]/(public)/layout.tsx` — Dark gradient background
- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` — Hero, sections, dark theme
- `apps/web/components/public/PublicHeader.tsx` — Glass header, dark theme
- `apps/web/components/public/PublicFooter.tsx` — Dark theme
- `apps/web/tailwind.config.ts` — font-heading, font-body

## Dependencies Added

- framer-motion
- lucide-react

## Performance Impact

- Fonts: Inter + Space Grotesk loaded via next/font (optimized)
- No additional heavy assets
- CSS variables for theming (no runtime cost)
- Framer Motion used only in new UI components (AIInsightCard, StatCard, Card)

## Mobile Design Spec

Created `docs/design-tokens/MOBILE_DESIGN_SYSTEM.md` — shared tokens for iOS/Android visual consistency.

## Dashboard & Auth

Dashboard and auth pages use existing components that reference CSS variables. The updated design-tokens.css applies the dark theme globally. No structural changes to DashboardShell or auth flows.

## Warnings

1. **Login/Register:** Use existing Input/Button with label and loading — restored from git.
2. **Dashboard:** Uses aistroyka-* variables; dark theme applied via token updates.
3. **Responsive:** Hero and cards use Tailwind breakpoints (sm, md, lg).
