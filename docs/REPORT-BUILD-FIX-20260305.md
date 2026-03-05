# Отчёт: исправление сборки (zod + Cloudflare/Vercel)

**Дата:** 2026-03-05  
**Проблема:** `Module not found: Can't resolve 'zod'` из `packages/contracts/src/schemas/*.ts` при `next build` в apps/web.

---

## 1. Диагностика

### Где импортируется zod

- **packages/contracts/src/schemas/** — во всех схемах: `tenant.schema.ts`, `subscription.schema.ts`, `ai.schema.ts`, `projects.schema.ts`, `config.schema.ts`, `health.schema.ts`, `sync.schema.ts` — везде `import { z } from "zod"`.
- Экспорт идёт через `packages/contracts/src/index.ts` (реэкспорт схем и типов).
- **apps/web** подключает пакет как `"@aistroyka/contracts": "file:../../packages/contracts"`.

### package.json

- **packages/contracts:** в `dependencies` уже был `"zod": "^3.23.8"` (3.x).
- **apps/web:** `zod` не объявлен, есть только зависимость на `@aistroyka/contracts`.
- **Корень:** не было `workspaces`, установка шла из корня (частично) и отдельно `cd apps/web && npm install` в build.

### Причина падения

При сборке Next в apps/web бандлер подтягивает исходники `@aistroyka/contracts` по `file:../../packages/contracts`. Разрешение модуля `"zod"` идёт из контекста этого пакета. Без единой установки из корня (workspaces) зависимости packages/contracts не оказывались в общем дереве node_modules, и `zod` не находился.

---

## 2. Что сделано

### Зависимости

- **packages/contracts:** `zod` оставлен в `dependencies` (уже был `^3.23.8`), экспорт схем/типов не менялся.
- В apps/web `zod` не добавляли — резолвится через workspace.

### Нормализация установки

- В **корне** добавлены:
  - `"packageManager": "bun@1.1.38"`
  - `"workspaces": ["apps/web", "packages/contracts", "packages/contracts-openapi", "packages/api-client"]`
- Команда **build** в корне изменена с  
  `cd apps/web && npm install && npm run build`  
  на  
  `cd apps/web && bun run build`.
- Установка зависимостей в CI должна выполняться **один раз из корня:** `bun install` (без дополнительного `npm install` в build).

### Lockfile

- Актуальный lockfile — **bun.lock** в корне (обновлён после `bun install`).
- Для CI достаточно одного менеджера (bun) и одной установки из корня.

---

## 3. Команды для проверки

Выполнялись из корня репозитория:

```bash
bun install
bun run build
cd apps/web && bun run build
```

Результат: `next build` в apps/web завершается без ошибок webpack, в том числе без `Can't resolve 'zod'`.

---

## 4. Рекомендации

1. **CI (Vercel / Cloudflare):**
   - Install: `bun install` (из корня, без `--cwd apps/web`).
   - Build: `bun run build` (из корня) или `cd apps/web && bun run build`.
   - В настройках проекта указать использование Bun (если платформа поддерживает).

2. **Fallback, если в CI нельзя использовать bun:**
   - Оставить в корне `workspaces` и вызывать из корня `npm install` (или `npm ci`), затем `npm run build`.
   - При необходимости добавить `zod` в **apps/web** в `dependencies` (ту же версию, что в packages/contracts), чтобы резолв гарантированно работал и без workspace hoisting.

3. **Дальше:**
   - Удалить дублирование зависимостей в корневом package.json (next, react и т.д.), если всё собирается только из apps/web через workspaces.
   - Зафиксировать в CI один способ установки (bun из корня) и описать его в docs/operations или README.
