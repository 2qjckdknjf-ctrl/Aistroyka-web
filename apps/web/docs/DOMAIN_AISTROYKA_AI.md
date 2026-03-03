# Подключение домена aistroyka.ai

## Что уже сделано в коде

- В `.env.production` задано `NEXT_PUBLIC_APP_URL=https://aistroyka.ai` (редиректы и www→apex будут использовать этот URL).
- Переменная загружена в Worker **aistroyka-web-production** (`npm run cf:secrets:prod`).
- В скрипте Supabase Auth добавлены `https://aistroyka.ai` и `https://www.aistroyka.ai` в список разрешённых URL (нужно один раз выполнить `npm run supabase:auth-urls` с PAT).

---

## Шаги в Cloudflare (нужно сделать вам)

Подробная инструкция по DNS и смене NS у регистратора: **[docs/DNS_AND_NAMESERVERS.md](DNS_AND_NAMESERVERS.md)**.

### 1. Домен должен быть в Cloudflare

- Если **aistroyka.ai** уже добавлен в Cloudflare (как сайт/зона) — переходите к шагу 2.
- Если нет: [Cloudflare Dashboard](https://dash.cloudflare.com) → **Websites** → **Add a site** → введите `aistroyka.ai` → следуйте инструкциям (смена NS у регистратора или добавление записей).

### 2. Привязать домен к Worker

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**.
2. Выберите Worker **aistroyka-web-production**.
3. Вкладка **Settings** → блок **Triggers** → **Custom Domains** → **Add Custom Domain**.
4. Введите **aistroyka.ai** (корневой домен) → **Add Custom Domain**.
5. При необходимости добавьте **www.aistroyka.ai** вторым Custom Domain (если нужен и корень, и www).

Cloudflare сам создаст нужные DNS-записи (CNAME/Proxy), если зона aistroyka.ai в том же аккаунте.

### 3. Supabase Auth (один раз)

Чтобы вход и регистрация работали на https://aistroyka.ai:

```bash
cd apps/web
SUPABASE_ACCESS_TOKEN=ваш_PAT npm run supabase:auth-urls
```

(Скрипт уже добавляет aistroyka.ai и www.aistroyka.ai в Redirect URLs.)

---

## Проверка

После сохранения Custom Domain подождите 1–2 минуты, затем откройте в браузере:

- **https://aistroyka.ai** — должен открываться production-сайт (редирект на /ru/login для неавторизованных).

Если открывается старая страница или ошибка — проверьте, что в Triggers выбран именно **aistroyka-web-production** и что DNS зоны aistroyka.ai указывает на Cloudflare.
