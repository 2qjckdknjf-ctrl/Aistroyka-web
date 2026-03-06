# Проверка через плагины Cloudflare и Supabase (2026-03-06)

**Цель:** Автоматически снять состояние через MCP-плагины и зафиксировать причину падения билда и один шаг для исправления.

---

## 1. Cloudflare (plugin-cloudflare-cloudflare-builds)

### Аккаунт и Worker

- **Account ID:** 864f04d729c24f574a228558b40d7b82  
- **Worker:** aistroyka-web-production (id: 7efae5acb9e64817a7f1753c1dc5a17a)

### Последние билды

Все последние билды (branch `release/vercel-prod-hardening-2026-03-05`) — **fail**.

Пример последнего: `72970176-607c-4d18-a688-aad5cb936fff` (2026-03-06 00:02 UTC).

- **Сохранённые команды:** buildCommand = `bun run cf:build`, deployCommand = `npx wrangler versions upload`.
- **Фактическое выполнение в логах:**
  - Install: `bun install --frozen-lockfile` — ок (из корня репо).
  - Build: `Executing user build command: bun run cf:build` → затем внутри скрипта: `$ cd apps/web && bun run cf:build` и `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` (без `--skipNextBuild`), т.е. полный `next build` из `apps/web`.

### Причина падения

1. Сборка по факту запускается **из `apps/web`** (root directory в настройках билда, скорее всего, указан как `apps/web` или проект привязан к этой папке).
2. Поэтому выполняется не корневой `bun run cf:build` (который сначала делает `build:contracts`), а локальный `cf:build` в apps/web.
3. В результате:
   - пакет `@aistroyka/contracts` не собирается до сборки Next;
   - Next подтягивает исходники `@aistroyka/contracts/src/index.ts` → **Module parse failed: Unexpected token** (TypeScript без сборки);
   - используется старый сценарий OpenNext (полный `next build` из apps/web, без standalone + ensure-styled-jsx-dist из монорепо).

### Один шаг для исправления в Dashboard

1. **Workers & Pages** → **aistroyka-web-production** → **Settings** → **Build** (или раздел конфигурации билда).
2. **Root directory** поставить **пустым** (или явно корень репо `/`), чтобы рабочей директорией билда был **корень репозитория**, а не `apps/web`.
3. **Build command** оставить: `bun run cf:build` (без `cd apps/web`).
4. Сохранить и запустить **Retry** последнего билда.

После этого будет выполняться корневой `bun run cf:build`: сначала `build:contracts`, затем `bun run --cwd apps/web cf:build` (standalone + fix-standalone + ensure-styled-jsx-dist + opennext build --skipNextBuild).

---

## 2. Supabase (plugin-supabase-supabase)

### Проекты

| Project   | Ref                  | Name      | Status          | Region      |
|----------|----------------------|-----------|-----------------|-------------|
| HiProject | dqtvxmqyrkxnptqswwyh | HiProject | INACTIVE        | eu-west-2   |
| AISTROYKA | vthfrxehrursfloevnlp | AISTROYKA | ACTIVE_HEALTHY  | eu-central-1 |

Отдельного **staging**-проекта нет. Для staging можно позже создать второй проект и прописать в нём свои env и Auth redirect URLs (см. REPORT-SUPABASE-20260305.md).

### Ограничения плагина

- Через плагин можно: list_projects, get_project, execute_sql, migrations, edge functions и т.д.
- Список **Auth redirect URLs** в ответе get_project не приходит; его нужно задавать вручную в **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs** (см. REPORT-SUPABASE-20260305.md).

---

## 3. Vercel

Плагин Vercel в текущем наборе MCP не найден. Проверку и отвязку доменов aistroyka.ai / www выполнять вручную в Vercel Dashboard (см. REPORT-DNS-DOMAINS-20260305.md).

---

## 4. Итог

- **Cloudflare:** причина падения билда и единственное необходимое изменение (Root directory + Retry) определены через плагин и зафиксированы выше. Само изменение в Dashboard плагин сделать не может — только просмотр билдов и логов.
- **Supabase:** список проектов снят; для Auth redirect URLs и второго (staging) проекта — ручная настройка по документации.
- **Vercel:** ручная проверка доменов по отчёту DNS/доменов.
