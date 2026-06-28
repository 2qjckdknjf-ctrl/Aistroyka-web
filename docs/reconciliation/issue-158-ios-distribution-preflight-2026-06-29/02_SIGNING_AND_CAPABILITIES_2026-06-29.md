# Signing & Capabilities (presence only, no secret values)

## Signing (resolved build settings)

| Setting | Manager | Worker |
|---|---|---|
| `DEVELOPMENT_TEAM` | `43A4KW5BKB` | `43A4KW5BKB` |
| `CODE_SIGN_STYLE` | Automatic | Automatic |
| `CODE_SIGN_IDENTITY` | Apple Development | Apple Development |
| `PROVISIONING_PROFILE_SPECIFIER` | not set (automatic) | not set (automatic) |

- Apple Team ID `43A4KW5BKB` matches the known App Store Connect team.
- Signing is **Automatic**; current resolved identity is **Apple Development** (the development identity).
- **For TestFlight / App Store an Apple Distribution certificate + App Store provisioning are required.** With Automatic signing, Xcode can manage these during an authenticated archive/export, but this requires a Distribution certificate available to the signing environment and an authenticated session — **not verifiable in this headless preflight**.

## Entitlements

| App | Entitlements file | Content |
|---|---|---|
| Manager | none referenced | — |
| Worker | `AiStroykaWorker/AiStroykaWorker.entitlements` (`CODE_SIGN_ENTITLEMENTS` set) | empty `<dict/>` |

## Capabilities

| Capability | Manager | Worker |
|---|---|---|
| Push Notifications (`aps-environment`) | absent | absent (empty entitlements) |
| Sign in with Apple (`com.apple.developer.applesignin`) | absent | absent |
| Associated Domains | absent | absent |
| `UIBackgroundModes` (remote notifications) | absent | absent |

## Info.plist privacy usage strings

| Key | Manager | Worker |
|---|---|---|
| `NSCameraUsageDescription` | absent | present |
| `NSPhotoLibraryUsageDescription` | absent | present |

## Blockers / owner decisions

1. **Distribution signing** — Apple Distribution certificate + App Store provisioning must be available for a real (signed) archive/upload. **OWNER_ACTION_REQUIRED.**
2. **Push Notifications / Sign in with Apple** — currently NOT configured. If pilot scope requires push or Apple sign-in, the capability + entitlement must be added in a separate, explicitly-approved iOS-source change (out of scope for this docs-only preflight). If pilot scope does not require them, no action needed.
