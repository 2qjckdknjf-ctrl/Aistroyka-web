# CI/CD Run Report — 2025-03-15

## Выполненные шаги

1. **Корень проекта** — `/Users/alex/Projects/AISTROYKA`
2. **Проверка apps/web** — директория существует
3. **Установка зависимостей** — `bun install --frozen-lockfile` — **OK**
4. **Сборка OpenNext** — `bun run cf:build` — **OK**
   - Сборка contracts
   - Next.js 15.5.12 production build (standalone)
   - OpenNext Cloudflare bundle
   - Патчи: bypass API middleware, middleware-manifest stub
5. **Проверка worker.js** — `apps/web/.open-next/worker.js` — **создан**
6. **Деплой на production** — `bun run cf:deploy:prod` — **OK**
   - dry-run → patch-bundle-require → wrangler deploy (wrangler.deploy.toml)

---

## Результаты деплоя

| Параметр | Значение |
|----------|----------|
| **Worker Version ID** | `3dcf4c52-310f-4b9a-9ba6-710174c0b86d` |
| **Preview URL (workers.dev)** | https://aistroyka-web-production.z6pxn548dk.workers.dev |
| **Alias URL (production)** | Настраивается в Cloudflare Dashboard (routes закомментированы в wrangler; типичный домен — например https://aistroyka.ai) |

---

## Что было собрано

- **packages/contracts** — сборка TypeScript
- **apps/web** — Next.js standalone build, OpenNext Cloudflare (worker + assets)
- Загружено 56 новых/изменённых статических файлов, 179 уже в кэше
- Worker: `aistroyka-web-production`

---

## Ошибки

- **Сборка:** нет
- **Деплой:** нет

---

## Итог

- **Сборка:** успешна
- **Деплой:** успешен
- **Рабочий сайт (preview):** https://aistroyka-web-production.z6pxn548dk.workers.dev
- **Production (если настроен домен в Dashboard):** домен, привязанный к Worker в Cloudflare (например aistroyka.ai)
