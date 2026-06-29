# Signed Build Evidence (local, no upload)

Environment: JDK 17 (JBR 17.0.14 arm64), Gradle 8.7, AGP 8.6.1, `--no-daemon`.
Build logs written to a local gitignored `evidence/` dir (NOT committed).
No upload, no publish task, no Play Console interaction.

## Build results (release variants, SDK 35)

| Task | Result |
| --- | --- |
| `:AiStroykaManager:bundleRelease` | **BUILD SUCCESSFUL** (incl. `signReleaseBundle`) |
| `:AiStroykaWorker:bundleRelease` | **BUILD SUCCESSFUL** (incl. `signReleaseBundle`) |
| `:AiStroykaManager:assembleRelease` | **BUILD SUCCESSFUL** |
| `:AiStroykaWorker:assembleRelease` | **BUILD SUCCESSFUL** |

## Artifacts produced (local only, NOT committed)

Release APKs are now **signed** (filenames no longer `-unsigned`):

```
android/AiStroykaManager/build/outputs/apk/release/AiStroykaManager-release.apk
android/AiStroykaWorker/build/outputs/apk/release/AiStroykaWorker-release.apk
android/AiStroykaManager/build/outputs/bundle/release/AiStroykaManager-release.aab
android/AiStroykaWorker/build/outputs/bundle/release/AiStroykaWorker-release.aab
```

## Signature verification (`apksigner verify`)

Both release APKs verify with **APK Signature Scheme v2 = true**:

```
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
```

Signing certificate (public fingerprint — not a secret; this is what Play displays):

```
Signer #1 certificate DN: CN=AiStroyka, OU=Mobile, O=AiStroyka, L=EU, ST=EU, C=DE
Signer #1 certificate SHA-256 digest: ab3929c9df0ad2bed2cfe65180114b776d796ab1da7f7e4e7494c46e0559a976
```

> Note: this is the **upload key** used locally. For Play distribution, confirm this
> upload key is registered with Play App Signing (or enroll it) before first upload.

## versionCode override proof

`./gradlew :AiStroykaManager:assembleRelease -PAISTROYKA_ANDROID_VERSION_CODE=42`
→ `output-metadata.json`:

```
versionCode: 42   versionName: 1.0.0   file: AiStroykaManager-release.apk
```

Default (no override) remains `versionCode = 1`.

## What this proves

- compileSdk/targetSdk **35** builds cleanly on the upgraded toolchain.
- Release **signing is wired** and produces signed APK + AAB from the local keystore.
- **versionCode is override-able** for store/CI builds without source edits.
- No secrets or artifacts were committed.
