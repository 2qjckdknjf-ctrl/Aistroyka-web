# Aistroyka Brand-First Token Model

## Objective
Define one canonical token contract used by web, iOS, and Android, with platform adapters but no platform-specific visual drift.

## Canonical Token Layers

### 1) Foundation Tokens
- `color.*`
- `typography.*`
- `spacing.*`
- `radius.*`
- `shadow.*`
- `opacity.*`
- `motion.*`

### 2) Semantic Tokens
- `surface.*` (primary, secondary, raised, muted)
- `text.*` (primary, secondary, tertiary, inverse)
- `border.*` (subtle, strong, focus)
- `feedback.*` (success, warning, error, info)
- `action.*` (primary, secondary, disabled)

### 3) Component Tokens
- `button.*`
- `input.*`
- `card.*`
- `badge.*`
- `alert.*`
- `table.*`

## Canonical Naming Rules
- Source of truth naming stays in `aistroyka` namespace.
- Legacy aliases (`--bg-main`, `--text-main`, etc.) are transitional only and must be scheduled for removal.
- Components must use semantic/component tokens, not raw color literals.

## Current Baseline Mapping

### Web
- Existing baseline lives in:
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/design-tokens.css`
  - `/Users/alex/Projects/AISTROYKA/apps/web/tailwind.config.ts`
- Required normalization:
  1. Keep `--aistroyka-*` as canonical.
  2. Deprecate duplicated legacy variables in `/Users/alex/Projects/AISTROYKA/apps/web/app/globals.css`.
  3. Ensure shared components in `/Users/alex/Projects/AISTROYKA/apps/web/components/ui` consume canonical tokens only.

### iOS
- Add dedicated token entry points (new files in app layer):
  - `Theme/ColorTokens.swift`
  - `Theme/TypographyTokens.swift`
  - `Theme/SpacingTokens.swift`
  - `Theme/RadiusTokens.swift`
- Update reusable primitives in `/Users/alex/Projects/AISTROYKA/ios/AiStroykaManager/AiStroykaManager/Design` to consume new token objects.
- Replicate same token-backed primitives in Worker app and remove local ad-hoc styling from login and foundational views.

### Android
- Add token resources and Compose adapters:
  - `res/values/colors.xml`
  - `ui/theme/Color.kt`
  - `ui/theme/Type.kt`
  - `ui/theme/Shape.kt`
  - `ui/theme/Theme.kt`
- Update `ManagerApp.kt` and `WorkerApp.kt` to consume branded theme and named spacing/radius constants.

## Token Governance Rules
- No new raw hex/rgb values in feature components.
- No direct hardcoded radius/spacing in feature-level code when token exists.
- New components must expose token-driven states: default, hover/pressed (where applicable), focus, disabled, loading, error.
- Public web and dashboard web must use the same semantic token vocabulary.

## Migration Constraints
- Preserve operational behavior in:
  - Auth flows
  - Tenant-aware dashboard shell
  - Locale-aware routing/navigation
- Visual migration is allowed only if it does not alter business logic or route guards.

## Done Criteria (Token Model)
- One approved token dictionary with mapping for web+iOS+Android.
- Legacy aliases explicitly tracked with removal milestones.
- Component-level usage rules documented and enforced in PR checklist.
