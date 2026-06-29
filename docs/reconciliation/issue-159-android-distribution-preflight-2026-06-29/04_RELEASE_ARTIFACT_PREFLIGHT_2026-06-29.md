# Release Artifact Preflight (no upload)

All tasks run locally with `JAVA_HOME` = JBR 17.0.14 (arm64), `--no-daemon`.
Build logs were written to a local `evidence/` directory that is **not committed**.

## Results

| Task | Result | Notes |
| --- | --- | --- |
| `:AiStroykaManager:assembleRelease` | **PASS** | BUILD SUCCESSFUL; produced `AiStroykaManager-release-unsigned.apk` |
| `:AiStroykaWorker:assembleRelease` | **PASS** | BUILD SUCCESSFUL; produced `AiStroykaWorker-release-unsigned.apk` |
| `:AiStroykaManager:bundleRelease` | **PASS** | BUILD SUCCESSFUL; produced unsigned `AiStroykaManager-release.aab` |
| `:AiStroykaWorker:bundleRelease` | **PASS** | BUILD SUCCESSFUL; produced unsigned `AiStroykaWorker-release.aab` |

## Artifact paths (local only, NOT committed)

```
android/AiStroykaManager/build/outputs/apk/release/AiStroykaManager-release-unsigned.apk
android/AiStroykaWorker/build/outputs/apk/release/AiStroykaWorker-release-unsigned.apk
android/AiStroykaManager/build/outputs/bundle/release/AiStroykaManager-release.aab
android/AiStroykaWorker/build/outputs/bundle/release/AiStroykaWorker-release.aab
```

## Signing status of produced artifacts

- APK filenames are `*-release-unsigned.apk`.
- Signature-block inspection of the Manager release APK: **v1 signature block ABSENT (unsigned)**.
- This is the expected consequence of having **no `signingConfigs`** wired (see `03_SIGNING_PREFLIGHT`).

## Interpretation

- **Structural build readiness: READY** — the release variants compile, run lint
  vital checks, and package successfully for both apps (APK + AAB).
- **Uploadable artifact readiness: OWNER_ACTION_REQUIRED** — Google Play requires
  the AAB be signed with the upload key. Current output is unsigned, so the AAB is
  **not** uploadable as-is. Wiring the existing keystore (`03_SIGNING_PREFLIGHT`)
  is the gating action.

No APK, AAB, or build log was committed.
