# Mobile E2E — worker ↔ manager system test

**Date:** 2026-05-19  
**Status:** **NOT EXECUTED** in this session (no pilot credentials injected; no report IDs captured).

## Intended scenario (from spec)

1. Worker logs in → task → start day → report → before photo → notes → after photo → submit.  
2. Manager sees pending report, opens detail, views evidence.  
3. Manager requests changes with note.  
4. Worker sees `changes_requested`, resubmits.  
5. Manager approves → terminal `approved` on backend; worker sees approval.

## Mixed matrix (planned)

| Path | Status |
|------|--------|
| iOS Worker + iOS Manager | Not run |
| Android Worker + Android Manager | Not run |
| Cross (iOS Worker → Android Manager) | Not run |

## When run, record (sanitized)

- Pilot email domain redacted (`user@…`).  
- Device/simulator model + OS.  
- Backend base URL.  
- Report UUID, media count, final status.  
- Screenshots path under `docs/audit/artifacts/`.  

## Blocker

Requires `E2E_*` / pilot env and manual or Playwright/mobile harness — out of scope for the automated build-only pass documented here.
