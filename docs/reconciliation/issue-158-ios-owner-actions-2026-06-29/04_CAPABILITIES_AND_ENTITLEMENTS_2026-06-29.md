# Capabilities & Entitlements — Owner Checklist — 2026-06-29

Decide the capability scope for the pilot and ensure the app entitlements match the
Apple Developer App ID capabilities (mismatches cause signing/upload failures).

## Decisions

- [ ] **Push Notifications**: required for pilot, or deferred?
  - If required: enable on the App ID and add the entitlement; configure APNs.
  - If deferred: ensure the entitlement is **not** present (avoid provisioning mismatch).
- [ ] **Sign in with Apple**: required for pilot, or deferred?
  - If required: enable on the App ID + entitlement; configure the Services ID/return URLs.
  - If deferred: ensure the entitlement is not present.
- [ ] **Associated Domains**: needed (universal links / web credentials)?
  - Enable + entitlement only if used.

## Verification

- [ ] App ID capabilities (Apple Developer) match the entitlements in the Xcode targets
- [ ] Both Manager and Worker entitlement decisions are recorded
- [ ] Record whether each capability is **required for pilot** or **deferred**

## Notes

- Keep the pilot minimal: enable only capabilities you will actually exercise, to reduce review/signing surface.
