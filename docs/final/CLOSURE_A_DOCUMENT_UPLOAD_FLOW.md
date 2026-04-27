# Closure A — §6D: загрузка файла документа

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md`).  
**Канон:** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md), [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## Назначение

Поток **upload** из `draft` → **`uploaded`** с записью `object_path` и защитой от «висящих» объектов в Storage.

## Repo-proof

- Маршрут: `POST .../documents/:documentId/upload` — см. E2E §2 «Загрузка без битых артефактов».
- Порядок: Storage → обновление строки (`uploaded` + `object_path`); при ошибке БД — **удаление объекта** из бакета (E2E).
- Ограничения и операционные хвосты — в E2E §2.

## Связь с проверкой

После `uploaded` менеджер переводит в **`under_review`**: [`CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md`](CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md).

## OPEN

Сценарий D чеклиста (симуляция сбоя) — зафиксировать на стенде или код-ревью с ссылкой на тикет.
