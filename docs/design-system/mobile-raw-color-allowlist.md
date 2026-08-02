# Mobile raw-color allowlist (drift gate)

Used by `node scripts/mobile/check-mobile-brand-drift.mjs` (always runs `--self-test` first).

## Allowed paths (token / theme / shared primitives only)

| Path | Reason |
|------|--------|
| `ios/Shared/.../Design/BrandTokens.swift` | Canonical hex → Color / UIKit chrome |
| `ios/Shared/.../Design/BrandPrimitives.swift` | Shared primitives |
| `ios/Shared/.../Design/BrandAppleSignInStyle.swift` | Apple style enum wrapper |
| `ios/Shared/.../Design/DesignPreviewRoot.swift` | DEBUG/UITest design gallery |
| `*/ManagerSemanticColors.swift` / `WorkerSemanticColors.swift` | App aliases |
| `android/shared/.../design/BrandTokens.kt` | Canonical ARGB |
| `android/shared/.../design/BrandColors.kt` | Compose Color accessors |
| `android/shared/.../design/BrandComponents.kt` | **Single** Compose primitive layer (no Manager/Worker forks) |
| `android/shared/.../design/DesignPreview.kt` | Deterministic preview gallery |
| `android/*/ui/*Theme.kt` | Material3 ColorScheme wiring |
| `android/*/ui/*SemanticColors.kt` | Thin aliases → BrandColors |
| `android/*/res/values/colors.xml` / `themes.xml` | Window/system bar XML |

## Line-level platform exceptions

| Pattern | Rationale |
|---------|-----------|
| `SignInWithAppleButton` / `signInWithAppleButtonStyle(.white\|.black\|.whiteOutline)` / `brandAppleSignInStyle()` | Apple-required control; dark navy uses whiteOutline (iOS 17+) or white (iOS 16). No custom Apple mark painting. |

## Explicitly banned in feature UI (self-tested)

- `.foregroundColor(.green/.orange/.secondary/…)`
- `.foregroundStyle(.orange/.secondary/.primary/…)`
- `Color(.secondarySystemBackground)`, `Color(.tertiarySystemFill)`, system grouped backgrounds
- `selected ? .white : .primary` and `return .green` style switches
- Android `MaterialTheme.colorScheme.*` and `Color(0x…)` outside allowlisted sources

## Not allowed

Per-app duplicated `ui/brand/BrandComponents.kt` forks (removed; shared module owns primitives).
