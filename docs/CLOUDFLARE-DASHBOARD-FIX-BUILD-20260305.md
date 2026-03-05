# Исправление билда в кабинете Cloudflare

**Дата:** 2026-03-05  
**Проблема:** билды падают с `Module not found: Can't resolve 'zod'` и используют старую команду (`cd apps/web && npm install && bun run build` → только Next.js, не OpenNext).  
**Решение:** сменить Build command в кабинете на каноническую (один раз).

---

## Что проверил плагин Cloudflare

- **Аккаунт:** подключён (id: 864f04d729c24f574a228558b40d7b82).
- **Воркер:** aistroyka-web-production (id: 7efae5acb9e64817a7f1753c1dc5a17a).
- **Последний билд:** fail; в логах — `Executing user build command: bun run build` → внутри скрипта выполняется `cd apps/web && npm install && bun run build` → `next build` → ошибка zod.
- **Плагин Cloudflare** даёт только **чтение** (аккаунты, воркеры, билды, логи). Менять Build command, Root directory и переменные окружения билда через плагин **нельзя** — только вручную в кабинете.

---

## Шаги в кабинете (ничего не ломаем)

1. Откройте: https://dash.cloudflare.com → **Workers & Pages**.
2. Выберите воркер **aistroyka-web-production**.
3. Перейдите **Settings** → **Build** (или **Builds**).
4. В блоке **Build configuration** измените:
   - **Build command** — поставьте ровно:  
     `bun run cf:build`  
     (сейчас там, скорее всего, `cd apps/web && npm install && bun run build` или просто `bun run build` — замените на указанное.)
   - **Root directory** — оставьте **пустым** (сборка из корня репозитория).
   - **Install command** — не задавайте свой; Cloudflare сам запускает `bun install --frozen-lockfile` из корня.
5. **Deploy command** для production-ветки оставьте: `npx wrangler deploy --env production` (или как у вас настроено для main). Для не-production можно: `npx wrangler versions upload --env staging` и т.п.
6. Сохраните настройки (**Save**).

После сохранения **следующий** билд (при пуше или Retry) уже пойдёт с новой командой: установка зависимостей из корня (bun), затем `bun run cf:build` (OpenNext в apps/web). В репозитории добавлен `apps/web/open-next.config.ts`, чтобы OpenNext не спрашивал в CI «create one? (Y/n)» и не падал с кодом 13. Ошибка zod уходит за счёт next.config (transpilePackages + webpack alias для zod).

**Если после этого в логах появится ошибка вида** `Could not resolve "../lib/..."` **в шаге «Bundling the OpenNext server»:** @opennextjs/cloudflare официально поддерживает Next 15+. При Next 14 используется флаг `--dangerouslyUseUnsupportedNextVersion`; при несовместимости внутренней структуры Next 14 с бандлером OpenNext единственный надёжный путь — **апгрейд до Next 15** (см. docs и security advisory Next.js).

---

## Зачем так

- **Один package manager:** только bun, без npm в pipeline.
- **Правильная цель сборки:** `cf:build` = OpenNext для Cloudflare, а не просто `next build`.
- **Корень репо:** зависимости и скрипты из корня (workspace), без лишнего `cd apps/web && npm install`.

---

## Откат

Если что-то пойдёт не так: в том же **Settings** → **Build** верните прежнюю Build command и сохраните. Затем разберите логи нового билда.

---

## Повторная проверка через плагин

После изменений в кабинете можно снова запросить логи последнего билда через плагин Cloudflare (Workers Builds): в логах должно быть `bun run cf:build` и вывод OpenNext, без `cd apps/web && npm install && bun run build` и без ошибки zod.
