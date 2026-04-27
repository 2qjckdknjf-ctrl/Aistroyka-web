# NOTIFICATIONS / REMINDERS — CLOSURE REPORT

## 1. Migration

- **status:** APPLIED
- **commands executed:** `cd apps/web && supabase db push`
- **result:** Migration `20260322500000_manager_notifications_project_id.sql` applied successfully. Column `project_id` added to `manager_notifications`.
- **target environment:** Remote Supabase (linked project)

## 2. Recipient targeting

### Event-by-event mapping (after fix)

| Event | Recipients |
|-------|------------|
| issue_created | Tenant managers (owner, admin, member) |
| issue_status_changed | Tenant managers |
| document_under_review | **Owner-side** (tenants.user_id + tenant_members role=owner) |
| document_owner_decision | Tenant managers |
| document_resubmitted | **Owner-side** |
| report_submitted | Tenant managers |
| task_assigned | Tenant managers |

### Что было не так

- Все события уходили одной группе `notifyTenantManagers` (owner, admin, member).
- События document_under_review и document_resubmitted требуют owner/customer-side — тех, кто принимает решение по документу.

### Что исправлено

- Добавлен `notifyOwnerSide`: получатели = tenant owner (tenants.user_id) + tenant_members с role=owner.
- `document_under_review` и `document_resubmitted` переведены на `notifyOwnerSide`.
- Fallback: если нет owner-side пользователей → `notifyTenantManagers`.

### Ограничения MVP

- Нет project-level owner (project.owner_id отсутствует).
- Нет project-scoped recipients для issues/reports.
- Viewer не получает уведомления.
- Дальнейшие шаги — вне scope.

## 3. Files changed

| File | Изменения |
|------|-----------|
| `apps/web/lib/domain/notifications/manager-notifications.repository.ts` | Добавлены `notifyOwnerSide`, `insertNotifications`; document_under_review/resubmitted используют owner-side |
| `apps/web/lib/domain/documents/document.service.ts` | Импорт `notifyOwnerSide`; вызовы для document_submit_for_review и document_resubmit |
| `apps/web/lib/domain/notifications/manager-notifications.repository.test.ts` | Тесты для `notifyOwnerSide` (owner + fallback) |
| `docs/product/NOTIFICATIONS_MVP.md` | Обновлена таблица targeting, добавлен раздел MVP limitations |
| `docs/product/NOTIFICATIONS_CLOSURE_REPORT.md` | Создан |

## 4. Runtime verification

- **Notifications list:** API GET /api/v1/notifications — покрыто тестами репозитория, tenant+user scoped.
- **Unread count:** API GET /api/v1/notifications/unread-count — покрыто тестами.
- **Mark read / mark all read:** PATCH endpoints — покрыто тестами репозитория (markRead, markAllRead).
- **Deep links:** buildNotificationUrl в NotificationsClient — project_id в ответе API.
- **Representative events:** Тесты notifyTenantManagers и notifyOwnerSide.
- **Cross-user safety:** Все запросы фильтруют по tenant_id и user_id; mark read требует eq(user_id).

Ручной smoke: открыть /dashboard/notifications, проверить badge, создать issue/document event — вне автоматического прогона.

## 5. Validation

| Check | Result |
|-------|--------|
| npm run build --workspace=@aistroyka/contracts | OK |
| npx tsc --noEmit | OK |
| npx next lint | OK (no warnings) |
| npx vitest run lib/domain | 95 tests passed |

## 6. Final status

**CLOSED**

## 7. Remaining notes

- Reminders — deferred (out of scope).
- Manual smoke на /dashboard/notifications рекомендуется для финальной проверки в браузере.
