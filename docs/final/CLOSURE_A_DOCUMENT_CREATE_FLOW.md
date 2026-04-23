# Closure A — §6D: создание документа (менеджер)

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_CREATE_FLOW.md`).  
**Канон:** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md), [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## Назначение

Описание потока **создания** записи документа в контексте проекта (старт в **`draft`**).

## Repo-proof

- Создание только в статусе черновика через `POST .../projects/:id/documents` — см. таблицу жизненного цикла в E2E, домен `document.service`.
- UI: `ProjectDocumentsPanel.tsx` (путь в E2E §«Ключевые пути»).

## Следующее действие для менеджера

После черновика — загрузка файла: [`CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md`](CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md).

## OPEN

Живой прогон по чеклисту на стенде — не заменяется этим файлом.
