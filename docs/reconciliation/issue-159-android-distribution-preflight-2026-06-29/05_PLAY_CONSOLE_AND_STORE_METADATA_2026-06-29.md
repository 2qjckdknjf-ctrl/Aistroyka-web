# Play Console Access & Store Metadata

## Play Console / publishing access

| Item | Verifiable locally | Notes |
| --- | --- | --- |
| Play Console access | **NO** | no credentials configured in this environment |
| Play app records (Manager / Worker) | **NO** | cannot query Play Console without service account / console login |
| Service account JSON | **NO** (not in repo) | per `AGENTS.md`, expected to live at gitignored `android/.secrets/google-play-service-account.json` — **not present locally** |
| Gradle Play Publisher / fastlane | **NO** | no automated publishing path in repo |

## Store metadata / listing readiness (not locally verifiable)

The following are Play Console-side artifacts that **cannot be verified from the
repo** and require owner action in the Play Console:

- App listing (title, short/full description, category) per app.
- Graphics: hi-res icon (512×512), feature graphic (1024×500), phone screenshots,
  (tablet screenshots if targeting tablets).
- Content rating questionnaire.
- **Data safety form** — required; must reflect:
  - Worker: network access (INTERNET) + **CAMERA** usage; Firebase Cloud
    Messaging (FCM) push.
  - Manager: network access (INTERNET).
- Privacy policy URL — required (especially given camera + account/auth data).
- Target audience & content, ads declaration, government-app declaration as applicable.
- Pricing & distribution / countries.

## Verdict

- Play Console access verifiable: **NO**
- App records verifiable: **NO**
- Store metadata readiness: **OWNER_ACTION_REQUIRED** (Play Console-side, out of repo scope)
