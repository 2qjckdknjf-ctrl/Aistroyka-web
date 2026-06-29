# Pilot Accounts & Data Gate

## Expected pilot cohort

- ~5 workers (Worker app)
- ~3 managers (Manager app)

## Required before distribution

| Item | Status |
| --- | --- |
| Pilot tenant confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Pilot project confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Manager/worker accounts confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Credentials delivery plan confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Staging vs production backend target decision confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Support contact confirmed | NOT VERIFIED IN THIS CHECKLIST |
| Rollback / removal plan confirmed | NOT VERIFIED IN THIS CHECKLIST |

## Notes

- iOS Layer B live E2E (PR #154) was run against **staging**
  (`https://staging.aistroyka.ai`). The pilot backend target (staging vs production)
  is an explicit owner decision and is **not** assumed here.
- Android release `buildConfig` `BASE_URL` defaults to `https://www.aistroyka.ai`
  unless overridden; the pilot target must be confirmed before distribution.

## Verdict

- **Pilot accounts/data readiness: OWNER_ACTION_REQUIRED** (not verified in this docs-only checklist).
