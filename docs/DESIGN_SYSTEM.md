# AISTROYKA Design System

Modern AI SaaS design system for web, dashboard, and mobile.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| --ai-white | #FFFFFF | Primary light, logos |
| --ai-yellow | #F5C518 | Primary accent, CTAs |
| --ai-pink | #F29CB2 | Secondary accent |
| --ai-dark | #0B0F19 | Main background |
| --bg-main | #0B0F19 | Page background |
| --bg-card | #1F2937 | Card/panel background |
| --text-main | #F9FAFB | Primary text |
| --text-muted | #9CA3AF | Secondary text |
| --border-main | #2B3648 | Borders |

## Typography

- **Primary:** Inter (body)
- **Headings:** Space Grotesk (headings)
- **Classes:** `font-heading`, `font-body`, `font-sans`

## Spacing

4pt grid. Use `var(--aistroyka-space-*)` or Tailwind `aistroyka-*` spacing.

## Radius

- `--radius-main`: 12px
- Card: `var(--aistroyka-radius-card)` (16px)

## Components

| Component | Location | Usage |
|-----------|----------|-------|
| Button | components/ui/Button | primary, secondary, ghost |
| Card | components/ui/Card | elevated, default |
| Input | components/ui/Input | label, error support |
| Badge | components/ui/Badge | status chips |
| AIInsightCard | components/ui/AIInsightCard | AI insights |
| StatCard | components/ui/StatCard | metrics |
| Panel | components/ui/Panel | glass panels |
| Icon | components/ui/Icon | lucide-react |

## Layout Rules

- Header: 64px height, semi-transparent, blur backdrop
- Sidebar: 224px (w-56), logo 24–32px
- Max content: max-w-7xl (1280px)
- Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px

## CSS Variables

All tokens live in `apps/web/app/design-tokens.css`. Use `var(--token-name)` in components.
