# Task Chat — Closure Audit (2026-07-18)

**Branch:** `feature/task-chat-worker-manager`  
**Verdict:** Implementation complete for v1 plan; automated tests green; live migration applied.

## Checklist vs plan

| Item | Status |
|------|--------|
| Schema `task_messages` + RLS + Realtime | DONE (applied to AISTROYKA) |
| GET/POST/DELETE messages API | DONE |
| Push `task_message` + data map for APNs/FCM | DONE (`buildPushDataMap`) |
| Media MIME/size caps (`task_chat`) | DONE |
| Web chat + Realtime + media playback + delete | DONE |
| i18n en/ru/es/it | DONE |
| iOS Shared `TaskChatView` Worker + Manager | DONE |
| Offline text queue (`sendTaskMessage`) | DONE |
| Offline media blocked with clear copy | DONE |
| Manager APNS + deep-link to task chat | DONE |
| Unread badge (local watermark) | DONE (Manager task list) |
| Voice/image/video preview | DONE (web + iOS) |
| Vitest (routes, service, media, push, cursor) | DONE |
| Docs feature note | DONE |

## Automated evidence

```text
bunx vitest run --maxWorkers=1 \
  lib/api/lite-allow-list.test.ts \
  lib/domain/task-messages/*.test.ts \
  app/api/v1/tasks/[id]/messages/**/*.test.ts \
  lib/platform/jobs/job.handlers/push-send.test.ts
```

Expect all suites green (see CI / local run).

`bun run i18n:check` — OK for `dashboardDetail.*`.

## Staging smoke (manual)

See `TASK_CHAT_FEATURE_NOTE.md`. Confirm after deploy:

1. Worker ↔ Manager text realtime/poll
2. Voice + photo + video with playback
3. Soft-delete own message
4. Manager push tap → Tasks tab → chat
5. Offline Worker text queues; media shows offline error

## Explicit non-goals (unchanged)

Live calls, Android UI, stakeholder chat, AI summarization.
