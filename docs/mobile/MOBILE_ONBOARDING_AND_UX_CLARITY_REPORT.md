# Mobile onboarding and UX clarity report

**Date:** 2026-05-19

## Worker apps

### iOS

- Tab/pager onboarding (`WorkerOnboardingView`) + “How it works” bullets cover project, shift, tasks, before/after photos, submit, sync intent.
- **Mission copy** (ru/en) updated on first onboarding page to match field-worker description (AISTROYKA Worker helps builders see tasks, before/after photos, submit to manager).

### Android

- First-run overlay + `WorkerStartGuidanceCard` (activation + AI hints when authenticated).
- **Fixed:** main app now includes **login + home + report** flow (not guide-only).
- **Gap:** `values-es` / `values-it` missing some new shift/photo strings → may fall back to English (**P1**).

## Manager apps

### iOS

- `ManagerOnboardingView` + `ManagerHowItWorksView`; ru/en first page body updated with AISTROYKA Manager mission wording.
- Report review: reject / request changes require manager note (`ReportsInboxView` / `ReportDetailReviewView`).

### Android

- `ManagerApp` onboarding + home/report flows; role-aware help hints.
- **Gap:** full Russian UI audit not completed (**P1**).

## Verdict

| App | First-run clarity | Empty / help | Mission copy |
|-----|-------------------|--------------|--------------|
| iOS Worker | OK | OK | Updated ru/en |
| iOS Manager | OK | OK | Updated ru/en |
| Android Worker | OK | OK | EN/RU strings; es/it partial |
| Android Manager | OK | Partial | Partial |

**NOT 100%** — Android secondary locales and deep polish remain.
