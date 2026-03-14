# Mobile Design System — Visual Consistency Spec

Shared tokens for iOS and Android apps to align with the web design system.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| ai-white | #FFFFFF | Primary light, text on dark |
| ai-yellow | #F5C518 | Accent, CTA, highlights |
| ai-pink | #F29CB2 | Secondary accent |
| ai-dark | #0B0F19 | Main background |
| bg-secondary | #111827 | Secondary background |
| bg-card | #1F2937 | Card/panel background |
| border-main | #2B3648 | Borders |
| text-main | #F9FAFB | Primary text |
| text-muted | #9CA3AF | Secondary text |

## Typography Scale

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| large | 34pt | Bold | Screen titles |
| title | 28pt | Semibold | Section headers |
| title2 | 22pt | Semibold | Card titles |
| headline | 17pt | Semibold | Body emphasis |
| body | 17pt | Regular | Body text |
| subheadline | 15pt | Medium | Labels |
| footnote | 13pt | Regular | Captions |
| caption | 12pt | Regular | Metadata |

**Fonts:** Inter (body), Space Grotesk (headings) — web equivalents. iOS: SF Pro; Android: Roboto.

## Spacing

4pt grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Inline spacing |
| md | 12px | Between elements |
| lg | 16px | Section padding |
| xl | 24px | Section gaps |
| touch-min | 44px | Touch targets |

## Radius

- sm: 6px
- md: 8px
- lg: 10px
- main: 12px
- card: 16px

## Shadows

- e1: 0 2px 4px rgba(0,0,0,0.3)
- e2: 0 4px 12px rgba(0,0,0,0.4)

## Implementation Notes

- Use semantic tokens, not raw hex in components.
- iOS: Assets.xcassets for colors; SwiftUI for typography.
- Android: res/values/colors.xml; themes.xml for surfaces.
- Do not implement full UI in this spec — only tokens for consistency.
