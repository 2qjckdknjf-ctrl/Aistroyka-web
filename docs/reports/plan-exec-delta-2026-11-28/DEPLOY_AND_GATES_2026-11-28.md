# Deploy + gates — 2026-11-28 finish-up

## Deploy
- Staging Deploy Cloudflare SUCCESS for `e53c82a6` (run 46188915486)
- Production Deploy Cloudflare SUCCESS for `e53c82a6` (run 46189203216) including stakeholder finance sanity + AI live/phase5 post-deploy jobs
- Direct `GET /api/v1/health` from this agent host: **TIMEOUT** (CF DNS resolves; treat Actions deploy as SHA evidence)

## Hosted migrations
Applied earlier this session — see `MIGRATION_APPLY_RECEIPT_2026-11-28.md`.

## Mode B gates (read-only, same shell)
All PASS including `APPROVE_*=YES`, ASC `.p8`, Play JSON, Distribution identity, ExportOptions, keystore.
New store build numbers for this run: iOS `2026112801`, Android `2026112801` (session override; prior env had older codes).

### Mode B execution (same session)
- iOS Worker+Manager archive/export **SUCCEEDED**; IPA signed Apple Distribution; TestFlight upload **SUCCEEDED** (Delivery UUIDs in `MODE_B_UPLOAD_2026-11-28.md`).
- Android AABs built with arm64 JBR-17 + `ANDROID_HOME`; Play internal **draft committed** for both apps at `versionCode=2026112801` (`MODE_B_ANDROID_UPLOAD_2026-11-28.json`). `completed` still blocked by Play cryptic targetSdk error.
- Device smoke still partial (no physical device connected this session).

## Dependabot
Open majors (#561–#567) not blind-merged. #568 (security-crypto leave-alpha → 1.1.0) CI green → merge when APPROVED. `release:check` on current main: PASS_WITH_WARNINGS.
