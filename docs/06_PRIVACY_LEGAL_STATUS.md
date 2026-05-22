# Privacy & Legal Status

Date: 2026-05-22  
Project: AISTROYKA

## Legal status matrix

| Item | Status | Owner | Evidence / note |
|---|---|---|---|
| Privacy Policy publication status | IN_PROGRESS | Legal/compliance | Baseline internal policy exists (`docs/PRIVACY-PII-POLICY.md`), but external/public legal publication status requires legal owner confirmation. |
| Terms of Service publication status | OPERATOR_REQUIRED | Legal/compliance | No finalized public ToS evidence in repo for this release lock pass. |
| Cookie/analytics disclosure status | IN_PROGRESS | Legal + product | Needs legal confirmation aligned with active analytics/cookies behavior before full public GA claim. |
| Data processing / GDPR readiness note | IN_PROGRESS | Legal/compliance + security | Internal PII policy and admin privacy findings endpoint exist; formal legal DPA/GDPR signoff evidence not attached in this pass. |
| App Store legal URL readiness (iOS) | OPERATOR_REQUIRED | iOS release manager + legal | Must ensure Privacy Policy / Terms URLs are set in App Store Connect metadata. |
| Play Store legal URL readiness (Android) | OPERATOR_REQUIRED | Android release manager + legal | Required if Android publication is enabled beyond deferred/internal track. |

## Release impact

- Blocks web/API runtime release: **No**
- Blocks mobile publication readiness claim: **Yes** (store/legal metadata signoff pending)
- Blocks full public GA claim: **Yes** (legal signoff not fully closed)

## Required operator actions

1. Legal owner confirms final public Privacy Policy URL and Terms URL.
2. Add signed legal approval record (date, approver, version) to release package.
3. Ensure App Store / Play legal URL fields are configured for the target release tracks.
4. Update this file statuses to `DONE` only with explicit evidence links.
