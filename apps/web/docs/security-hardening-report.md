# Отчёт: усиление безопасности для продакшена

**Дата:** 2026-02-23  
**Проект:** AISTROYKA-WEB  
**Режим:** Production Security Hardening  

---

## Изменённые файлы

| Файл | Изменения |
|------|-----------|
| **middleware.ts** | Добавлены заголовки безопасности (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS в production) и минимальный CSP; применяются ко всем ответам и редиректам через `applySecurityHeaders()`. |
| **app/error.tsx** | **Новый.** Клиентский error boundary: сообщение «Something went wrong», кнопки Try again / Go home, без стек-трейсов и чувствительных данных. |
| **app/not-found.tsx** | **Новый.** Корневая страница 404: «Page not found», кнопка Go home, минимальный UI. |

**Шаг 1 (console.log):** В `app/`, `lib/` и `middleware.ts` вызовов `console.log` не было. Единственное вхождение — в `scripts/print-server-ts-head.cjs` (скрипт для сборки, не продакшен). Изменений по этому пункту не вносилось.

---

## Реализованные меры

### Заголовки безопасности (middleware)

- **X-Frame-Options:** DENY  
- **X-Content-Type-Options:** nosniff  
- **Referrer-Policy:** strict-origin-when-cross-origin  
- **Permissions-Policy:** camera=(), microphone=()  
- **Strict-Transport-Security:** max-age=31536000; includeSubdomains; preload (только в production)  
- **Content-Security-Policy:**  
  `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; connect-src 'self' https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline';`

### Error boundary и 404

- **app/error.tsx** — дружелюбный UI, без стек-трейсов и чувствительной информации.  
- **app/not-found.tsx** — минимальная страница «Page not found» с ссылкой на главную.

---

## Сборка

- **Команда:** `bun run cf:build`  
- **Результат:** успешно. Next.js build и OpenNext bundle завершены, worker в `.open-next/worker.js`.

---

## Деплой

- **Команда:** `bun run cf:deploy`  
- **Результат:** успешно.  
- **Worker:** aistroyka-web  
- **URL:** https://aistroyka-web.z6pxn548dk.workers.dev  
- **Version ID:** aa0a39a1-ae88-4470-a479-418e1914f51c  

---

## Предупреждения (некритичные)

1. **Next.js 14.2.18** — предупреждение о неподдерживаемой версии от OpenNext; сборка идёт с флагом `--dangerouslyUseUnsupportedNextVersion`.  
2. **webpack.cache** — «Serializing big strings (133kiB) impacts deserialization performance»; только на этапе сборки.  
3. **Unknown file extension: .icloud** — от бандлера OpenNext (вероятно, локальные iCloud-файлы); на результат сборки не повлияло.  
4. **CSP** — для совместимости с гидрацией Next 14 используется `'unsafe-inline'` в script-src и style-src; при необходимости позже можно ужесточить (nonces/hashes).

---

## Итог

- Заголовки безопасности и CSP добавлены в middleware; HSTS только в production.  
- Добавлены `app/error.tsx` и `app/not-found.tsx` без утечки деталей ошибок.  
- В app/lib/middleware нет продакшен-логов в консоли; правок не требовалось.  
- Сборка и деплой выполнены успешно.
