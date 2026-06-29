# Final Verdict — iOS App Store Owner-Action Checklist — 2026-06-29

## Verdict

| Gate | Verdict |
| --- | --- |
| iOS owner checklist safe | **YES** (docs-only; no upload; no Apple state mutation) |
| iOS no-sign archive readiness | **PASS** (Manager + Worker, per PR #161) |
| TestFlight readiness | **OWNER_ACTION_REQUIRED** |
| App Store readiness | **OWNER_ACTION_REQUIRED** |
| Issue #158 can close | **NO** |

## Why #158 cannot close yet

Closure requires signed **TestFlight upload evidence** plus owner approval. The
local archive readiness is proven (PR #161), but the Apple-side prerequisites in this
checklist (Distribution certificate + provisioning, ASC app records, capabilities,
ExportOptions.plist, upload path, store metadata/App Privacy, build-number bump) are
owner-only and not yet done.

## Next exact step

1. Owner completes the checklist files in this folder:
   - Apple Developer signing (`02_*`)
   - ASC app records (`03_*`)
   - Capabilities/entitlements (`04_*`)
   - Export & upload path (`05_*`)
   - Store metadata/privacy (`06_*`)
   - Mode B TestFlight upload requirements (`07_*`)
2. Re-run the signed iOS archive/export/TestFlight evidence task with explicit owner
   approval, a confirmed build number, Distribution signing, a valid app-store
   `ExportOptions.plist`, and an ASC API key (or approved interactive upload path).
3. Upload to **TestFlight** only and capture the upload response as the final evidence
   for #158, then close #158 with owner approval.
