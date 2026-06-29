# Legal, Privacy & Store Metadata Gate

## Required artifacts (both platforms)

| Item | Status |
| --- | --- |
| Privacy policy URL | OWNER_ACTION_REQUIRED |
| Terms of service URL (if needed) | OWNER_ACTION_REQUIRED |
| App Store privacy declarations (App Privacy "nutrition label") | OWNER_ACTION_REQUIRED |
| Google Play Data safety form | OWNER_ACTION_REQUIRED |
| Content / age rating | OWNER_ACTION_REQUIRED |
| Screenshots (per platform/device class) | OWNER_ACTION_REQUIRED |
| Listing text (title, description) | OWNER_ACTION_REQUIRED |
| Support / contact email | OWNER_ACTION_REQUIRED |

## Platform-specific privacy drivers

- **Worker (iOS & Android):** camera usage (photo capture) and push notifications
  (FCM on Android). These must be reflected in App Store App Privacy and Google Play
  Data safety, and covered by the privacy policy.
- **Manager (iOS & Android):** network/account data; reflect auth + data handling in
  privacy declarations.

## Verdict

- **Legal / privacy / store metadata readiness: OWNER_ACTION_REQUIRED.**
- No compliance readiness is claimed in this checklist. These are store-console- and
  legal-side artifacts that cannot be verified from the repo.
