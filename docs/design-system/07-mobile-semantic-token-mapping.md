# Mobile Semantic Token Mapping (Block 1 — live web aligned)

Canonical source: `apps/web/app/design-tokens.css` (`--aistroyka-*`).
Docs marked Wave B complete that mapped iOS to `systemGroupedBackground` are **stale**; live code wins.

## Semantic → platform

| Semantic | Web token | iOS (`BrandTokens`) | Android (`BrandTokens` → theme) |
|----------|-----------|---------------------|----------------------------------|
| `bg.page` | `--aistroyka-bg-primary` `#040A18` | `bgPage` | `BG_PAGE` → `colorScheme.background` |
| `bg.secondary` | `--aistroyka-bg-secondary` `#0B1428` | `bgSecondary` | `BG_SECONDARY` |
| `surface` | `--aistroyka-surface` `#101B33` | `surface` | `SURFACE` → `colorScheme.surface` |
| `surface.muted` | `--aistroyka-surface-muted` `#1F2E4D` | `surfaceMuted` | `SURFACE_MUTED` |
| `text.primary` | `--aistroyka-text-primary` | `textPrimary` | `TEXT_PRIMARY` |
| `text.muted` | `--aistroyka-text-secondary` | `textSecondary` | `TEXT_SECONDARY` → `onSurfaceVariant` |
| `action.primary` | `--aistroyka-accent` `#F5C518` | `actionPrimary` | `ACTION_PRIMARY` → `primary` |
| `action.primary.on` | `--aistroyka-text-inverse` `#050B1C` | `textOnPrimary` | `TEXT_ON_PRIMARY` → `onPrimary` |
| `state.success/warning/error/info` | matching `--aistroyka-*` | `state*` | `STATE_*` |

## Source-of-truth files

- iOS shared: `ios/Shared/Sources/Shared/Design/BrandTokens.swift`, `BrandPrimitives.swift`
- iOS aliases: `ManagerSemanticColors.swift`, `WorkerSemanticColors.swift`
- Android shared: `android/shared/.../design/BrandTokens.kt`
- Android themes + semantic wrappers + `ui/brand/BrandComponents.kt`

## Rules

1. Feature screens must not use system grouped backgrounds or raw palette colors.
2. Prefer Shared/brand primitives (buttons, cards, fields, badges, empty/error/loading).
3. Drift gate: `node scripts/mobile/check-mobile-brand-drift.mjs` (+ allowlist doc).
