# Current iOS State — 2026-06-29

## Status snapshot

| Item | State |
| --- | --- |
| Manager no-sign archive | **PASS** (ARCHIVE SUCCEEDED) |
| Worker no-sign archive | **PASS** (ARCHIVE SUCCEEDED) |
| TestFlight readiness | **OWNER_ACTION_REQUIRED** |
| App Store readiness | **OWNER_ACTION_REQUIRED** |
| Upload performed | **NO** |
| Apple Developer mutated | **NO** |
| App Store Connect mutated | **NO** |

## PR #161 evidence summary

- Xcode: 26.6
- Apps: AiStroykaManager, AiStroykaWorker
- Bundle IDs: `ai.aistroyka.manager`, `ai.aistroyka.worker`
- Apple Team ID: `43A4KW5BKB`
- Manager no-sign archive: ARCHIVE SUCCEEDED
- Worker no-sign archive: ARCHIVE SUCCEEDED

## Known blockers (all owner / Apple-side)

1. Distribution certificate + App Store provisioning profiles.
2. ASC API key access **or** approved interactive Xcode upload path.
3. App-store `ExportOptions.plist`.
4. Push Notifications / Sign in with Apple capability decision.
5. Store metadata / App Privacy declarations.
6. Build number bump before upload.
7. Signed TestFlight upload evidence.

These are enumerated as actionable checklists in the following files.
