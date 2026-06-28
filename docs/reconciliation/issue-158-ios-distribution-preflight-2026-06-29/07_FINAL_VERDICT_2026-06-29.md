# Final Verdict — iOS Distribution Readiness Preflight

| Question | Verdict |
|---|---|
| iOS distribution preflight performed safely (no upload, no mutation) | **YES** |
| TestFlight readiness | **OWNER_ACTION_REQUIRED** |
| App Store readiness | **OWNER_ACTION_REQUIRED** |
| issue #158 can close | **NO — keep open** until blockers cleared and a signed upload is evidenced |

## What is ready

- Project/scheme/target structure for Manager + Worker is sound.
- Bundle IDs and Team ID are correct (`ai.aistroyka.manager` / `ai.aistroyka.worker`, `43A4KW5BKB`).
- No-sign archive succeeds for both apps.
- AppIcon source asset present (1024×1024 single-size) — prior 120/152 missing-icon concern resolved at asset level.
- Build/runtime evidence already merged (PR #146 simulator + login smoke; PR #154 Layer B staging E2E 3/3).

## Blockers (owner / separate approved work)

1. **Distribution signing** — Apple Distribution certificate + App Store provisioning must be available to the signing environment (current resolved identity is Apple Development).
2. **App Store Connect credentials** — no `.p8`/API key configured in this environment; ASC access and app-record state not verifiable here.
3. **Export config** — no `ExportOptions.plist` (`method = app-store`) in repo.
4. **Capabilities decision** — Push Notifications and Sign in with Apple are absent; owner must confirm whether pilot scope needs them (if yes → separate, approved iOS-source change).
5. **Store metadata/privacy** (App Store path only) — screenshots, descriptions, app-privacy "data safety", age rating, export compliance — none verifiable locally.
6. **Build number policy** — increment `CURRENT_PROJECT_VERSION` per upload.

## Owner actions required

- Provide/confirm Apple Distribution certificate availability.
- Provide/confirm App Store Connect API key (gitignored) or perform interactive Xcode upload.
- Decide on Push / Sign in with Apple capability scope for pilot.
- Add an `ExportOptions.plist` (app-store) in a separate approved change when ready to export.

## Next exact step

Run the **Android distribution readiness preflight (issue #159)**, then consolidate both into the **mobile pilot distribution decision checklist (issue #160)**. A signed TestFlight upload remains a separate, explicitly-approved action — not performed here.
