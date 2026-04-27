# Phase 4 — Закрытие документного workflow (отчёт)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 4 и §6.11.

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **PARTIAL** |
| **Следующая фаза разрешена** | **YES** — при закрытии пунктов приёмки из раздела E (live) |

---

## B. Backend API

Реализованы маршруты под `apps/web/app/api/v1/projects/[id]/documents`:

- коллекция `documents` (GET/POST и т.д. — см. `route.ts`);
- `documents/[documentId]` — метаданные / обновление;
- `documents/[documentId]/upload` — загрузка файла;
- `documents/[documentId]/decision` — решение по документу;
- `documents/[documentId]/approval-history` — история.

Доменные тесты (пример): `lib/domain/documents/*.test.ts`.

---

## C. Manager UI

На странице проекта используется клиентская панель **`ProjectDocumentsPanel.tsx`** (`dashboard/projects/[id]/`), которая:

- загружает список через `GET /api/v1/projects/:id/documents`;
- создаёт документ `POST …/documents`;
- загружает файл на `…/documents/:id/upload`;
- обновляет статус / связи (mutations на PATCH/обновление);
- показывает пустые состояния и таблицу.

Фрагмент интеграции с v1:

```58:65:apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx
async function fetchDocuments(projectId: string): Promise<ProjectDocument[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}
```

---

## D. Интеграция в «manager actions»

Требование ТЗ: pending документы видны в слое действий.  
**Статус:** **PARTIAL** — нужна точечная проверка связей `priority-actions` / intelligence с `documents` pending; в коде есть зачатки cross-domain (поиск по репо: `document` в dashboard).

---

## E. Приёмка §6.11 (чеклист)

| Критерий | Статус |
|----------|--------|
| Manager проходит полный UI-flow без ручного API | **PARTIAL** — панель реализована; нужен **сценарный** прогон на staging |
| Ошибка upload не оставляет битое состояние | **NEEDS_LIVE_VERIFICATION** |
| Нет сиротских метаданных | **PARTIAL** — зависит от сервера и UI обработки ошибок |
| Статусы однозначны | **PARTIAL** — сверить с доменной моделью и переводами |
| validation/tests/build | build/test см. Phase 1; dedicated E2E documents — **OPEN** |

---

## F. Рекомендации

1. Playwright-сценарий: создать документ → upload ≤25MB → смена статуса → decision → проверка истории.
2. Включить документ в pilot-smoke или отдельный nightly, если критично для релиза.

---

## G. Шаблон ТЗ §12

- **PHASE STATUS:** PARTIAL  
- **NEXT PHASE ALLOWED:** YES  
- **NEXT WORKSTREAM:** Phase 5 (costs live) + E2E для документов
