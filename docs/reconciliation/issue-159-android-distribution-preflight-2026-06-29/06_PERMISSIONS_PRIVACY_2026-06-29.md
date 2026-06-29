# Permissions & Privacy Surface

Source: `android/AiStroykaManager/src/main/AndroidManifest.xml`,
`android/AiStroykaWorker/src/main/AndroidManifest.xml`, `android/shared/src/main/AndroidManifest.xml`.

## AiStroykaManager

| Item | Value |
| --- | --- |
| Permissions | `android.permission.INTERNET` |
| Exported components | `MainActivity` (`exported="true"`, LAUNCHER) |
| Services | none |
| Backup | `allowBackup="true"` |

## AiStroykaWorker

| Item | Value |
| --- | --- |
| Permissions | `android.permission.INTERNET`, `android.permission.CAMERA` |
| Exported components | `MainActivity` (`exported="true"`, LAUNCHER) |
| Services | `WorkerFirebaseMessagingService` (`exported="false"`, FCM `MESSAGING_EVENT`) |
| Backup | `allowBackup="true"` |

`android/shared` declares an empty `<manifest/>` (no extra permissions).

## Privacy / data-safety implications

| Surface | Implication |
| --- | --- |
| INTERNET (both) | Standard network access; declare data collection/transmission in Data safety. |
| CAMERA (Worker) | Camera usage must be declared in the Play **Data safety** form and justified in the listing; ensure a privacy policy covers photo capture. |
| FCM push (Worker) | Push messaging present. |
| `allowBackup="true"` (both) | Default auto-backup enabled — review whether sensitive auth/local data should be excluded from backup before GA. |

## Observations / potential gaps (not changed here)

- **`POST_NOTIFICATIONS` not declared** in Worker despite FCM. On Android 13+
  (API 33+), apps must request the `POST_NOTIFICATIONS` runtime permission to show
  notifications. With `targetSdk 34`, missing this permission means notifications
  will be silently suppressed on Android 13+. Not a Play *upload rejection*, but a
  functional gap for push UX — owner should address in a code PR.
- **No `FileProvider`** is declared in the Worker manifest despite CAMERA usage.
  If the camera flow shares image URIs, a `FileProvider` is typically required.
  Verify the camera capture path before GA (functional, not an upload blocker).

These are recorded as observations; **no manifest is modified in this preflight.**
