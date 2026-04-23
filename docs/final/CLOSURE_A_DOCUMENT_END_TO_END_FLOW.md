# Closure A — §6D: сквозной поток документа (менеджер)

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_END_TO_END_FLOW.md`).  
**Канон (детализация):** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md).

## Краткая цепочка

1. **Создать** (draft) — [`CLOSURE_A_DOCUMENT_CREATE_FLOW.md`](CLOSURE_A_DOCUMENT_CREATE_FLOW.md).  
2. **Загрузить** файл (uploaded) — [`CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md`](CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md).  
3. **Связи** с проектом/вехой/отчётом/задачей — [`CLOSURE_A_DOCUMENT_LINKAGE_FLOW.md`](CLOSURE_A_DOCUMENT_LINKAGE_FLOW.md).  
4. **Отправить на проверку** (under_review) → **решение** → при необходимости **архив** — [`CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md`](CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md).

## Вердикт по репозиторию

Совпадает с E2E: **да по коду** для цепочки статусов и отката Storage при ошибке БД после upload; **живой прогон** — OPEN (E2E §5).

## Ключевые пути в коде

Список файлов — в конце [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md).
