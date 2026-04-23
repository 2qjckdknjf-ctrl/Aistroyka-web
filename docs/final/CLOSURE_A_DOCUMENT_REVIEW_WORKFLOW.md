# Closure A — §6D: проверка и решения по документу

**Дата:** 2026-03-23  
**Роль:** выход AGENTS.md §6D (`CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md`).  
**Канон:** [`CLOSURE_A_DOCUMENT_E2E.md`](CLOSURE_A_DOCUMENT_E2E.md), [`CLOSURE_A_DOCUMENT_CHECKLIST.md`](CLOSURE_A_DOCUMENT_CHECKLIST.md).

## Назначение

Поток **`under_review`** → решение менеджера (**`approved` / `rejected` / `changes_requested`**) с опциональным `decision_comment`, далее **`archived`** по политике.

## Repo-proof

- Таблица переходов E2E §1 (строки «На проверку», «Решение», «Правки → снова», «Архив»).
- Политика: `validateDocumentStatusTransition`, `document.policy.ts`.
- API: `PATCH .../documents/:id`; запрос правок через тот же контракт — E2E §1.
- Параллельный контур владельца: `POST .../decision` — [`PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md`](PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md).

## Аудит и «следующее действие»

- События в `audit_logs`, UI истории — E2E §4.

## OPEN

Полный ручной прогон сценариев A–C чеклиста на staging/production.
