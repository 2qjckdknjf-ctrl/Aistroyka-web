# Localization, brand, and UX polish

**Date:** 2026-05-19

## Brand

- App names: AiStroyka Worker / Manager; onboarding references AISTROYKA mission text (ru/en) for Worker and Manager first pages.

## Localization

| Locale | iOS Worker | iOS Manager | Android Worker | Android Manager |
|--------|------------|-------------|------------------|-----------------|
| en | OK | OK | OK | OK |
| ru | OK | OK | OK | OK |
| es | Present | Present | Present (critical runtime messages localized) | Present (critical runtime messages localized) |
| it | Present | Present | Present (critical runtime messages localized) | Present (critical runtime messages localized) |

## Raw technical messages

- Android Worker/Manager critical runtime banners and action messages moved to string resources (`en/ru/es/it`) for login/bootstrap/report/review errors and confirmations.
- Android Worker/Manager now also map common API statuses (`401/403/404/409/5xx`) and `lite_client_path_forbidden` to localized UX messages.
- Worker/Manager report status labels in UI (`submitted/approved/rejected/changes_requested/open`) now render localized text instead of raw backend status keys.
- Worker sync/pipeline progress states are now localized in-app (`idle/syncing/synced/offline/error` and upload pipeline phases) instead of raw internal labels.
- Manager AI analysis pipeline statuses are localized in detail screen (`pending/running/completed/failed`).
- Remaining non-localized surfaces are mostly backend-provided dynamic payload text outside known status/code mappings.

## Verdict

**PARTIALLY COMPLETE** — major Android hardcoded English leakage reduced and key API error paths localized; full semantic localization of all server-originated payload text remains open.
