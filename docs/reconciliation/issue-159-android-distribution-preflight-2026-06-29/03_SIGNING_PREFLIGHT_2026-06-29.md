# Signing Preflight (no secrets)

## Gradle signing configuration

- **No `signingConfigs` block exists** in either `AiStroykaManager/build.gradle.kts`
  or `AiStroykaWorker/build.gradle.kts`.
- Neither module defines a `release` `signingConfig`, nor reads
  `keystore.properties` / `key.properties`.
- Consequence: `assembleRelease` / `bundleRelease` produce **unsigned** artifacts
  (`*-release-unsigned.apk`, unsigned `*-release.aab`).

## Keystore material presence (presence-only)

| Item | Status |
| --- | --- |
| `android/.secrets/` | PRESENT |
| `android/.secrets/upload-keystore.jks` | PRESENT |
| `android/keystore.properties` | PRESENT |
| `android/.secrets/keystore.properties` | MISSING |

`android/keystore.properties` defines the following **key names only** (values
redacted, never printed/committed):

```
storeFile=<REDACTED>
storePassword=<REDACTED>
keyAlias=<REDACTED>
keyPassword=<REDACTED>
```

So the upload-key material exists locally, but it is **not wired into Gradle**.

## Git hygiene note (observation only — not changed here)

- `android/.secrets/upload-keystore.jks` and `android/keystore.properties` are
  currently **untracked** (not committed) — good.
- However, `git check-ignore` reports they are **NOT matched by a `.gitignore`
  rule** (the existing `secrets`/`secrets/` patterns do not match the dotted
  `android/.secrets/` path). They are safe today only because they were never
  `git add`-ed. **Owner action (separate PR):** add explicit ignore rules for
  `android/.secrets/`, `**/*.jks`, and `android/keystore.properties` to prevent
  accidental commits. This preflight intentionally does not modify `.gitignore`.
- `android/AiStroykaWorker/google-services.json` is tracked on `main` (Firebase
  FCM config). Left unchanged.

## Signed release artifact readiness

**OWNER_ACTION_REQUIRED** — to produce an uploadable signed AAB the owner must:

1. Add a `release` `signingConfig` to each app module that reads the existing
   `keystore.properties` (store file, store password, key alias, key password).
2. Confirm the upload key matches the key registered in Play App Signing (or
   enroll Play App Signing with this upload key).
3. Keep all keystore material out of git.
