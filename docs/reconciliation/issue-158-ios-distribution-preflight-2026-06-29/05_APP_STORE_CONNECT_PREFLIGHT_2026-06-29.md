# App Store Connect Preflight (presence only)

## Tooling availability

| Tool | State |
|---|---|
| `xcrun` | available (`/usr/bin/xcrun`) |
| `xcrun notarytool` | available |
| `xcrun altool` | available |

## Credential presence (no values printed)

| Item | Detected locally |
|---|---|
| `.p8` / AuthKey file in `ios/Config/` | NO |
| App Store Connect API key env vars (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`) | all unset |

No App Store Connect API credentials are configured in this environment.

## Consequences

- **ASC access verifiable: NO** — without an API key (or interactive Xcode auth), this preflight cannot query App Store Connect.
- **App records verifiable: NO** — cannot confirm app record state, TestFlight groups, or metadata completeness from here.

Per existing workspace facts, the App Store Connect app records and the `.p8` AuthKey are expected to exist on the owner's side (gitignored); they are simply **not present/configured in this preflight environment**.

## Owner actions required

1. Provide/confirm the App Store Connect API key (`.p8` + key id + issuer id) in a secure, gitignored location, OR perform an authenticated upload via Xcode Organizer.
2. Confirm App Store Connect app records exist for `ai.aistroyka.manager` and `ai.aistroyka.worker` (Team `43A4KW5BKB`).
3. Confirm TestFlight internal/external test group configuration.

No App Store Connect state was queried or mutated.
