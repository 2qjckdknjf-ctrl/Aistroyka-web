# Play App Signing & Upload Key — Owner Checklist — 2026-06-29

## Checklist

- [ ] Enroll `ai.aistroyka.manager` in Play App Signing
- [ ] Enroll `ai.aistroyka.worker` in Play App Signing
- [ ] Register / confirm the upload key for each app
- [ ] Verify the upload-key certificate matches the local signing certificate where applicable
  - Local release cert summary (non-secret): `CN=AiStroyka, OU=Mobile, O=AiStroyka, L=EU, ST=EU, C=DE`
- [ ] Keep the keystore local only (`android/.secrets/upload-keystore.jks`)
- [ ] Do **not** commit keystore, `android/keystore.properties`, or any password
- [ ] If a fingerprint must be recorded, record only the **non-secret** SHA-256 certificate fingerprint (not the private key)

## How Play App Signing works (reference)

- Play holds the **app signing key**; you upload with your **upload key**.
- The local keystore in `android/.secrets/` is the **upload key** — it signs the AAB you upload; Google re-signs with the app signing key for distribution.
- The upload key can be reset by Google if lost, but the app signing key cannot — keep both safe and uncommitted.

## Safety

- No secret values are stored in this repo.
- Certificate **private** material must never be printed or committed.
