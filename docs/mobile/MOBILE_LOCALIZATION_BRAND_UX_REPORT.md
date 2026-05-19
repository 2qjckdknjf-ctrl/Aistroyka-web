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
- Remaining non-localized surfaces are mostly backend-provided dynamic messages and status codes from API payloads.

## Verdict

**PARTIALLY COMPLETE** — major Android hardcoded English leakage reduced; full semantic localization of server-originated error payloads remains open.
