# Auth login fix report (Cloudflare / OpenNext)

## Проблема

- В production (Cloudflare/OpenNext) после входа отображалась ошибка **"Login step: error:unknown"**.
- Сессия не сохранялась: после редиректа на dashboard пользователь снова попадал на логин.

## Причины

1. **Неинформативная ошибка**  
   Ошибки из Supabase и исключения на клиенте приводились к одному сообщению "error:unknown", без кода и traceId.

2. **Клиентский логин и cookies**  
   Логин выполнялся только на клиенте через `createBrowserClient`; сессия попадала в **localStorage**. Middleware и защищённые маршруты читают сессию из **cookies** через `createServerClient`. В результате после успешного входа следующий запрос шёл без cookie-сессии, и middleware редиректил обратно на логин.

3. **Отсутствие проверки окружения**  
   При отсутствии `NEXT_PUBLIC_SUPABASE_*` не было явной проверки при старте и понятного сообщения в UI.

## Что сделано

### Этап 1 — Трассировка и диагностика

- Введён **traceId** (uuid) на каждую попытку входа; он передаётся в логи и в сообщение об ошибке в UI.
- На клиенте: `console.error` с `traceId`, `errorCode`, `message` (пароль не логируется).
- В UI: показ сообщения из Supabase при его наличии, иначе `"Ошибка авторизации (код, traceId: …)"`.

### Этап 2 — Проверка окружения

- **Источник переменных:** `.env.local` (локально); в Cloudflare — переменные сборки (Build → Environment variables), т.к. `NEXT_PUBLIC_*` подставляются в бандл при сборке.
- На странице логина при монтировании вызывается `hasSupabaseEnv()`; при отсутствии env показывается Alert и кнопка входа отключена.
- В dev/preview при отсутствии env middleware возвращает **503** с текстовым сообщением.

### Этап 3 — Auth flow под Cloudflare (cookies/SSR)

- Логин перенесён в **server action** `signInAction` в `app/[locale]/(auth)/login/actions.ts`.
- Используется Supabase **server client** (`createClient()` из `@/lib/supabase/server`) с cookie-хранилищем; после `signInWithPassword` Supabase записывает сессию в cookies ответа.
- Форма логина вызывает `signInAction`; ответ с **Set-Cookie** приходит клиенту, после чего выполняется `router.push` + `router.refresh`. Middleware на следующем запросе видит сессию в cookies и не редиректит на логин.

### Этап 4 — Smoke tests

- Добавлен маршрут **GET /api/health/auth**: возвращает `{ hasSupabaseEnv, authConfigured }` без секретов.
- Локальная проверка: `cd apps/web && npm run cf:build && npm run start` (или `npm run dev` с `.env.local`).

## Как проверить

1. **Локально (Next)**  
   - `cd apps/web && npm run dev`  
   - Открыть `/en/login`, ввести учётные данные → после входа должен открыться dashboard, обновление страницы не сбрасывает сессию.

2. **Локально (Cloudflare build)**  
   - `cd apps/web && npm run cf:build && npm run start`  
   - Убедиться, что в сборку попали `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` (через env при сборке или `.env.local`).  
   - Если `cf:build` падает из‑за конфликта ESLint (plugin "@next/next"), это отдельная проблема конфига; компиляция проходит успешно.

3. **Health**  
   - `GET /api/health` — общий health (в т.ч. Supabase).  
   - `GET /api/health/auth` — только `hasSupabaseEnv` и `authConfigured`.

4. **Production (Cloudflare)**  
   - В настройках проекта задать переменные сборки для Production/Preview.  
   - Задеплоить, войти на логин → после входа редирект на dashboard и сессия сохраняется.

## Изменённые файлы (сводка)

- `apps/web/app/[locale]/(auth)/login/page.tsx` — трассировка, env-check на mount, вызов server action вместо клиентского Supabase.
- `apps/web/app/[locale]/(auth)/login/actions.ts` — новый server action для входа с установкой cookies.
- `apps/web/lib/env.ts` — комментарий об источниках env; без изменения логики.
- `apps/web/lib/supabase/middleware.ts` — при отсутствии env в dev/preview возврат 503.
- `apps/web/middleware.ts` — проброс 503 от `updateSession`.
- `apps/web/app/api/health/auth/route.ts` — новый маршрут для smoke-проверки auth env.
