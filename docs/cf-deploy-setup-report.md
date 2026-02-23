# Отчёт: настройка локального деплоя Cloudflare Workers

**Дата:** 2026-02-23  
**Цель:** Настроить локальный workflow сборки и деплоя в Cloudflare Workers для репозитория AISTROYKA-WEB.

---

## 1. Проверка инструментов

| Инструмент | Результат |
|------------|-----------|
| **node** | v20.20.0 ✓ |
| **bun** | не найден в PATH |
| **npm** | использовался для установки и скриптов |

Скрипты в `package.json` универсальны: работают и с `npm run`, и с `bun run` (после установки bun).

---

## 2. Wrangler

- Уже в **devDependencies**: `wrangler@^3.99.0`
- Установленная версия (npx): **3.114.17**
- Предупреждение в консоли: рекомендуется обновление до wrangler@4 (`npm install --save-dev wrangler@4`)

---

## 3. Авторизация wrangler

**Команда:** `npx wrangler whoami`

**Результат:** «You are not authenticated. Please run `wrangler login`.»

В неинтерактивной среде (Cursor/агент) выполнить `wrangler login` нельзя. Для локального деплоя нужно один раз в своём терминале:

```bash
npx wrangler login
npx wrangler whoami
```

Для CI/скриптов — задать переменную окружения:

```bash
export CLOUDFLARE_API_TOKEN="<токен>"
```

Создание токена: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

---

## 4. Скрипты package.json

| Скрипт | Значение | Статус |
|--------|----------|--------|
| **cf:build** | `node scripts/print-server-ts-head.cjs && opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` | без изменений |
| **cf:deploy** | `wrangler deploy` | добавлен |

---

## 5. Локальная сборка (cf:build)

**Команда:** `npm run cf:build`

**Результат:** успешно.

- Выполнен proof: в лог выведены первые 60 строк `lib/supabase/server.ts` (в т.ч. типизированный `setAll(cookiesToSet: CookieToSet[])`).
- Next.js 14.2.18 собран (с предупреждением о неподдерживаемой версии; использован флаг `--dangerouslyUseUnsupportedNextVersion`).
- OpenNext сгенерировал бандл для Cloudflare.
- Worker сохранён: `.open-next/worker.js`
- Сообщение: «OpenNext build complete.»

---

## 6. Деплой (cf:deploy)

**Команда:** `npm run cf:deploy`

**Результат в данной среде:** ошибка.

**Текст ошибки:**  
«In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.»

Логи: `/Users/alex/Library/Preferences/.wrangler/logs/wrangler-2026-02-23_15-20-17_973.log`

Для успешного деплоя локально:

1. Выполнить в терминале: `npx wrangler login`, затем `npx wrangler whoami`.
2. В корне репо: `npm run cf:deploy` (или `bun run cf:deploy`).

После успешного деплоя в выводе будет URL вида:  
`https://aistroyka-web.<account-subdomain>.workers.dev`

Конфиг проекта в `wrangler.toml`: **name = "aistroyka-web"**.

---

## 7. Созданные/обновлённые файлы

- **package.json** — добавлен скрипт `cf:deploy`.
- **docs/cf-deploy-workflow.md** — краткая инструкция по установке, логину, сборке и деплою.
- **docs/cf-deploy-setup-report.md** — этот отчёт.

---

## 8. Рекомендации для анализа

1. **Обновление wrangler:** при необходимости перейти на wrangler@4 (проверить совместимость с OpenNext и текущим `wrangler.toml`).
2. **CI/CD:** для деплоя из CI задавать `CLOUDFLARE_API_TOKEN` в секретах и вызывать `npm run cf:build && npm run cf:deploy`.
3. **Bun:** при желании использовать bun — установить и заменить вызовы `npm` на `bun` в инструкциях; скрипты менять не требуется.
4. **Проверка после логина:** после первого успешного `wrangler login` повторить `npm run cf:deploy` и зафиксировать в отчёте итоговый URL приложения.

---

*Конец отчёта.*
