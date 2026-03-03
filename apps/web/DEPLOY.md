# Деплой на Cloudflare (aistroyka.ai)

Чтобы увидеть изменения на сайте в интернете:

## 1. Миграции в Supabase

Если добавлялись новые таблицы (tenant_members, tenant_invitations и т.д.):

- Открой **Supabase Dashboard** → **SQL Editor**.
- Выполни SQL из `scripts/supabase-migrations-bundle.sql` (или только новые миграции из `engine/Aistroyk/supabase/migrations/` по порядку).

Либо через CLI, если настроен `SUPABASE_DB_URL`:

```bash
cd apps/web
npm run db:migrate
```

## 2. Секреты Cloudflare

В `.env.production` или `.env.production.local` должны быть:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (например `https://aistroyka.ai`)
- по желанию `SUPABASE_SERVICE_ROLE_KEY` (для автосоздания бакета media при загрузке)

Загрузить их в Worker:

```bash
cd apps/web
./scripts/set-cf-secrets.sh production
```

(Для dev: `./scripts/set-cf-secrets.sh` без аргумента.)

## 3. Сборка и деплой

```bash
cd apps/web
npm run deploy:prod
```

Или по шагам:

```bash
npm run cf:build
npm run cf:deploy:prod
```

Первый раз нужно войти в Cloudflare: `npx wrangler login`.

После деплоя сайт обновится на https://aistroyka.ai .
