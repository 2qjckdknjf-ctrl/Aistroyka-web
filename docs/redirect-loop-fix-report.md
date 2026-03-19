# Production redirect loop — fix (domain redirect only on Vercel)

## Итог

- **Canonical domain:** `https://www.aistroyka.ai`
- **aistroyka.ai → www:** только через **Vercel Domains** (redirect в настройках домена)
- В коде приложения **нет** редиректов по домену (ни www→apex, ни apex→www)

## 1. Что было не так

В production (Vercel logs):
- `source = edge-middleware`, `domain = www.aistroyka.ai`, `requestPath = /`, `responseStatusCode = 308`
- Middleware отдавал 308 для www, из‑за чего возникал цикл с настройкой Vercel (apex → www).

В коде были блоки, которые по `host` делали редирект (сначала www→apex, потом apex→www). Любой такой редирект в коде конфликтовал с Vercel Domains.

## 2. Где искали и что убрали

### Middleware

- **`apps/web/middleware.ts`** — единственный **активный** middleware для production (Next.js собирается из `apps/web`, next.config там же). В нём удалена вся логика по `host` / `hostname` и редиректы на другой домен.
- **`middleware.ts`** (корень репо) — не используется при сборке из `apps/web`; из него тоже убрана domain-логика, чтобы не было расхождений при смене точки входа.

### Другие места

- В `next.config.js` и `vercel.json` редиректов по домену нет.
- `getAppUrl()` и `NEXT_PUBLIC_APP_URL` **не** используются для редиректов в middleware; только для sitemap, invite, metadata и т.п.

### Нормализация canonical URL (без редиректов)

- Дефолтный canonical URL везде приведён к `https://www.aistroyka.ai`:
  - `apps/web/lib/config/public.ts`
  - `apps/web/lib/app-url.ts`
  - `apps/web/app/layout.tsx`
  - `lib/app-url.ts` (корень)

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `apps/web/middleware.ts` | Удалён весь блок с `host`, `canonicalOrigin` и редиректом apex→www. Оставлен комментарий: domain canonicalization только в Vercel Domains. |
| `middleware.ts` | Удалены чтение `host` и редирект по домену. Оставлен комментарий. |
| `apps/web/lib/config/public.ts` | Дефолт `NEXT_PUBLIC_APP_URL`: `https://www.aistroyka.ai`. |
| `apps/web/lib/app-url.ts` | Fallback и комментарии: `https://www.aistroyka.ai`. Не используется для middleware redirect. |
| `apps/web/app/layout.tsx` | Fallback для `baseUrl`: `https://www.aistroyka.ai`. |
| `lib/app-url.ts` | Дефолт и комментарий: `https://www.aistroyka.ai`; явно указано, что не для domain redirects. |

## 4. Проверки после деплоя

Выполнить после выката на Vercel:

```bash
# Один запрос, смотреть статус и заголовок location
curl -I https://www.aistroyka.ai
curl -I https://aistroyka.ai
curl -I https://aistroyka-web-web-v7jq.vercel.app

# Следовать редиректам (L), убедиться, что нет цикла
curl -IL https://www.aistroyka.ai
curl -IL https://aistroyka.ai
```

Ожидаемое поведение:

- **https://www.aistroyka.ai** — не отдаёт 308 на apex; либо 200, либо 307 на `/ru` (или другой locale). В заголовках **не** должно быть `location: https://aistroyka.ai/`.
- **https://aistroyka.ai** — один редирект на `https://www.aistroyka.ai` (от Vercel Domains).
- **https://aistroyka-web-web-v7jq.vercel.app** — как раньше (например, редирект на `/ru`).

Если после деплоя www снова отдаёт 308 на apex — проверить, что задеплоена именно эта версия (без host-based redirect в middleware) и что нет кэша edge/браузера.
