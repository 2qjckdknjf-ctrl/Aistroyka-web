# Closure A — документы менеджера: сквозной сценарий (E2E по коду)

**Продукт:** Aistroyka web (`apps/web`)  
**Дата:** 2026-03-23  
**Метод:** трассировка UI → API → доменная логика (живой прогон на стенде в этом heartbeat не выполнялся).  
**Имена §6D AGENTS.md:** формальный комплект — [`CLOSURE_A_DOCUMENT_CREATE_FLOW.md`](CLOSURE_A_DOCUMENT_CREATE_FLOW.md), [`CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md`](CLOSURE_A_DOCUMENT_UPLOAD_FLOW.md), [`CLOSURE_A_DOCUMENT_LINKAGE_FLOW.md`](CLOSURE_A_DOCUMENT_LINKAGE_FLOW.md), [`CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md`](CLOSURE_A_DOCUMENT_REVIEW_WORKFLOW.md), [`CLOSURE_A_DOCUMENT_END_TO_END_FLOW.md`](CLOSURE_A_DOCUMENT_END_TO_END_FLOW.md), [`CLOSURE_A_DOCUMENT_VALIDATION.md`](CLOSURE_A_DOCUMENT_VALIDATION.md), [`CLOSURE_A_DOCUMENT_POST_AUDIT.md`](CLOSURE_A_DOCUMENT_POST_AUDIT.md). Этот файл остаётся **сводной трассировкой кода**.

---

## Вердикт

**Да (по репозиторию)** — цепочка **draft → uploaded → under_review → (approved | rejected | changes_requested) → archived** для менеджера с правами `canManageProjects` согласована политикой `validateDocumentStatusTransition`, UI панели проекта и маршрутами API. После правок в этом спринте:

- менеджер может **запросить правки** с опциональным комментарием (`decision_comment`) через тот же `PATCH`, что и одобрение/отклонение;
- при сбое записи в БД после успешной загрузки в Storage **объект в бакете удаляется**, чтобы не оставлять «висящих» файлов без строки документа в `uploaded`.

Связь с проектом: все записи `project_documents` создаются с `project_id`; список и действия идут через `/api/v1/projects/:id/documents/...`.

---

## 1. Жизненный цикл статусов

| Шаг | Кто | UI / API | Политика |
|-----|-----|----------|----------|
| Черновик | Менеджер | `POST .../documents` → `draft` | Создание только в `draft` (`document.service`) |
| Файл | Менеджер | `POST .../documents/:id/upload` | Только из `draft`; путь `{projectId}/documents/{uuid}.ext` |
| На проверку | Менеджер | `PATCH .../documents/:id` `{ status: under_review }` | Из `uploaded` |
| Решение | Менеджер | `PATCH` → `approved` / `rejected` / `changes_requested` + опц. `decision_comment` | Из `under_review`; `decided_by` выставляется из `ctx.userId` |
| Правки → снова | Менеджер | из `changes_requested` → `under_review` (или `uploaded`) | Как в `document.policy` |
| Архив | Менеджер | `PATCH` → `archived` | Из допустимых состояний по политике |

Отдельный путь владельца проекта: `POST .../documents/:id/decision` — остаётся параллельным контуром (см. [PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md](./PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md)).

---

## 2. Загрузка без «битых» артефактов

- Пока файл не загружен, статус не переходит в `uploaded` без `object_path` через штатный upload-route (сначала Storage, затем `updateDocument` с парой `object_path` + `status: uploaded`).
- **Если обновление строки в БД после upload в Storage завершилось ошибкой**, выполняется `remove` объекта из бакета `media`, чтобы не копить недостижимые объекты.

Ограничение: гонки и сбои вне этого маршрута (ручное удаление строки и т.д.) по-прежнему требуют операционной уборки — это вне scope данного закрытия.

---

## 3. Связь с проектом и сущностями

- Обязательный `project_id` при создании; фильтрация списка по проекту в репозитории.
- В UI колонка «Связь»: веха (`milestone_id`), отчёт (`report_id` → ссылка на `/dashboard/reports/...`), задача (`task_id` → `/dashboard/tasks/...`).

---

## 4. Аудит и история

- Переходы статусов дают события в `audit_logs` (`document_upload`, `document_submit_for_review`, `document_review`, …).
- `GET .../documents/:id/approval-history` + модалка «История» в `ProjectDocumentsPanel`.

---

## 5. Что остаётся на живую проверку

Один полноценный прогон на staging/production с менеджерской учёткой: создать документ → загрузить → отправить на проверку → три исхода (включая запрос правок с текстом) → при необходимости архив. Зафиксировать скриншоты или ID сущностей в тикете спринта.

---

## Ключевые пути в репозитории

- UI: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- Upload: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
- PATCH: `apps/web/app/api/v1/projects/[id]/documents/[documentId]/route.ts`
- Домен: `apps/web/lib/domain/documents/document.service.ts`, `document.policy.ts`, `document.repository.ts`
- Локали панели документов: `apps/web/messages/{en,ru,es,it}.json` → `projects.documents`
