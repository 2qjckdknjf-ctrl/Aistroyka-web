# Mobile Semantic Token Mapping (Wave B)

This document defines the canonical semantic token layer for mobile UI and how it maps to platform primitives.

## Scope
- iOS: `AiStroykaManager`, `AiStroykaWorker` (SwiftUI views)
- Android: `AiStroykaManager`, `AiStroykaWorker` (Compose UI)
- Goal: remove direct raw color usage from screens and use semantic aliases.

## Canonical Semantic Tokens
- `bg.page` - app page background
- `surface.muted` - grouped/list surface
- `text.muted` - secondary informational text
- `action.primary` - primary action fill/text
- `state.success` - success status
- `state.warning` - warning/attention status
- `state.error` - error status
- `state.info` - informational status

## Android Mapping (Compose)
- Source-of-truth files:
  - `android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerSemanticColors.kt`
  - `android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerSemanticColors.kt`
- Mapping:
  - `bg.page` -> `MaterialTheme.colorScheme.background`
  - `text.muted` -> `MaterialTheme.colorScheme.onSurfaceVariant`
  - `action.primary` -> `MaterialTheme.colorScheme.primary`
  - `action.primary.on` -> `MaterialTheme.colorScheme.onPrimary`
  - `action.primary.disabled` -> `MaterialTheme.colorScheme.surfaceVariant`
  - `state.error` -> `MaterialTheme.colorScheme.error`
  - `state.success` -> `MaterialTheme.colorScheme.primary` (temporary until dedicated success token is added)
  - `state.info` -> `MaterialTheme.colorScheme.primary` (temporary)

## iOS Mapping (SwiftUI)
- Source-of-truth files:
  - `ios/AiStroykaManager/AiStroykaManager/Design/ManagerSemanticColors.swift`
  - `ios/AiStroykaWorker/AiStroykaWorker/WorkerSemanticColors.swift`
- Mapping baseline:
  - `bg.page` -> `Color(.systemGroupedBackground)`
  - `surface.muted` -> `Color(.secondarySystemGroupedBackground)`
  - `action.primary` -> `Color.accentColor`
  - `action.primary.on` -> `Color.white`
  - `action.primary.disabled` -> `Color.gray`
  - `state.error` -> `Color.red`
  - `state.warning` -> `Color.orange`
  - `state.success` -> `Color.green`
  - `state.info` -> `Color.blue`

## Rules For New Mobile UI Code
- Do not use direct `.red/.green/.orange/...` in view nodes.
- Do not use direct `MaterialTheme.colorScheme.*` in Android screens; call semantic wrappers.
- Prefer semantic alias enums/objects first; only wrappers map to platform palette.
- If a new semantic state appears, add it to token wrappers before using it in screens.

## Next Hardening Step
- Introduce dedicated success/warning/info colors in Android theme (instead of temporary primary mapping).
- Optional: extract a single shared token package for iOS Manager + Worker once target-level separation constraints are reviewed.
