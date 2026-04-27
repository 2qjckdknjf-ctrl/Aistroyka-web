# Aistroyka Design Audit Baseline (Brand-First)

## Purpose
Create a single baseline of current UI state across web and mobile before migration to a brand-first unified design system.

## Scope Inventory

### Web
- Public marketing shell and navigation:
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/[locale]/(public)/layout.tsx`
  - `/Users/alex/Projects/AISTROYKA/apps/web/components/public/PublicHeader.tsx`
- Auth surfaces:
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/[locale]/(auth)/layout.tsx`
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/[locale]/(auth)/login/page.tsx`
- Dashboard shell and product navigation:
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/[locale]/(dashboard)/layout.tsx`
  - `/Users/alex/Projects/AISTROYKA/apps/web/components/DashboardShell.tsx`
- Token and UI foundations:
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/design-tokens.css`
  - `/Users/alex/Projects/AISTROYKA/apps/web/app/globals.css`
  - `/Users/alex/Projects/AISTROYKA/apps/web/tailwind.config.ts`
  - `/Users/alex/Projects/AISTROYKA/apps/web/components/ui`
  - `/Users/alex/Projects/AISTROYKA/apps/web/lib/ui-tokens.ts`

### iOS
- Manager reusable design primitives:
  - `/Users/alex/Projects/AISTROYKA/ios/AiStroykaManager/AiStroykaManager/Design`
- Worker login and foundational UI patterns:
  - `/Users/alex/Projects/AISTROYKA/ios/AiStroykaWorker/AiStroykaWorker/Views/LoginView.swift`
- Shared runtime layer (non-UI):
  - `/Users/alex/Projects/AISTROYKA/ios/Shared/Sources/Shared`

### Android
- Manager app UI shell and feature surfaces:
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt`
- Worker app UI shell and feature surfaces:
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt`
- Current Android theme declarations:
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaManager/src/main/res/values/themes.xml`
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaWorker/src/main/res/values/themes.xml`
- Shared runtime layer (non-UI):
  - `/Users/alex/Projects/AISTROYKA/android/shared/src/main/java/ai/aistroyka/shared`

## Findings by Domain

### Colors and Theming
- **P0**: Web has two overlapping token styles (`--aistroyka-*` and legacy `--bg-main`/`--text-main`) declared in both `design-tokens.css` and `globals.css`.
- **P0**: Android themes are minimal and default-like (`Theme.Material.Light.NoActionBar`) without project color token files (`colors.xml` not present in current foundation path).
- **P1**: iOS uses mostly system semantic colors (`systemGray6`, grouped backgrounds, accentColor) instead of a strict project brand palette.

### Typography
- **P1**: Web defines explicit tokenized scale in CSS and Tailwind mappings.
- **P1**: Mobile relies on platform defaults (SwiftUI text styles, Compose typography), not a centralized cross-platform token contract.

### Spacing and Radius
- **P0**: Web already exposes spacing/radius tokens, but public surfaces still mix legacy and tokenized variables.
- **P1**: Android hardcodes spacing/radius values in composables (for example `24.dp`, `4.dp`, `8.dp`, `16.dp`) without named token wrappers.
- **P1**: iOS has reusable Manager components but Worker UI still uses direct values and local styling in key flows.

### Components and States
- **P0**: Web component usage is mixed across three layers: global utility classes, `/components/ui`, and local per-page styles.
- **P1**: iOS Manager has design primitives (`LoadingStateView`, `ErrorStateView`, `EmptyStateView`, `KPICard`), but Worker has less reuse.
- **P1**: Android Manager/Worker repeat layout and interaction patterns across separate app files instead of a unified UI primitives package.

## Risk Assessment (Auth / Tenant / Dashboard)
- **P0 Risk**: Direct broad restyling of dashboard shell can affect role navigation, locale switching, and stakeholder portal behavior.
- **P0 Risk**: Auth surfaces (`/login`, mobile login screens) are operationally critical and should migrate by token substitution first, not layout rewrites.
- **P1 Risk**: Public pages can diverge from dashboard visuals if legacy variables remain active.
- **P1 Risk**: Inconsistent token names across platforms increase regression risk and review overhead.

## Recommended Priority Queue

### P0 (Must complete first)
1. Freeze canonical naming and token source-of-truth (single token dictionary and alias policy).
2. Eliminate web token duplication drift (`design-tokens.css` vs `globals.css` legacy declarations).
3. Establish mobile token entry points (iOS theme tokens + Android color/typography/shape tokens) before screen migrations.

### P1 (Next)
1. Normalize shared core components for primary flows:
   - Buttons, inputs, cards, badges, alerts, loading/empty/error states.
2. Align public header/footer and dashboard shell to one semantic token vocabulary.
3. Unify Manager/Worker mobile primitive set for repeated UI patterns.

### P2 (After foundation)
1. Screen-level visual refinements by business domain.
2. Motion polish and advanced state visuals.
3. Optional per-platform enhancement variants that still map to canonical tokens.

## Acceptance Criteria for Baseline Completion
- Inventory covers web public/auth/dashboard and both mobile apps.
- All critical style drifts are mapped to P0/P1/P2.
- Risks are explicitly linked to auth/tenant/dashboard safety constraints.
- This baseline is approved as the reference for token model and rollout wave planning.
