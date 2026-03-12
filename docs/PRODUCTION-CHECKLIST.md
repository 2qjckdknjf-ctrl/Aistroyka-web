# Production Checklist — Aistroyka

Проверки перед и после публикации сайта на Vercel (или другом хосте).

---

## Перед деплоем

- [ ] **Env variables** — в Vercel заданы минимум:  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`.
- [ ] **NEXT_PUBLIC_APP_URL** совпадает с итоговым доменом (например `https://aistroyka.ai`), без trailing slash.
- [ ] **Supabase:** в проекте Supabase в Authentication → URL Configuration добавлены Site URL и Redirect URLs, соответствующие production-домену.
- [ ] **Сборка:** локально выполнен `npm install` и `npm run build` из корня репозитория без ошибок (см. [REPORT-DEPLOY-READY.md](./REPORT-DEPLOY-READY.md)).

---

## После деплоя (первая проверка)

- [ ] **Homepage** — главная страница открывается по production URL, без 5xx.
- [ ] **Dashboard** — после входа открывается `/en/dashboard` (или выбранная локаль), данные подгружаются.
- [ ] **Auth** — вход/выход и регистрация работают; редиректы ведут на правильный домен.
- [ ] **API** — например `GET /api/health` возвращает 200; при необходимости проверить `/api/system/health`.
- [ ] **Favicon / иконки** — в браузере отображается иконка (если добавлен `public/favicon.ico`; иначе может использоваться только SVG из `metadata.icons`).
- [ ] **Logo** — логотип на сайте ведёт на `/brand/aistroyka-logo.svg` (или актуальный путь) и отображается.
- [ ] **SEO** — тег `<title>` и meta description на главной соответствуют ожидаемым; `metadataBase` в layout задан через `NEXT_PUBLIC_APP_URL`.
- [ ] **Sitemap / robots** — `https://<your-domain>/sitemap.xml` и `https://<your-domain>/robots.txt` открываются и содержат корректный домен.

---

## Опционально (по мере необходимости)

- [ ] **Cron / jobs** — если используются cron-эндпоинты, заданы `REQUIRE_CRON_SECRET=true` и `CRON_SECRET`; вызовы защищены.
- [ ] **Stripe** — если включён биллинг, в Stripe Dashboard настроен webhook на production URL и заданы `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] **AI** — при использовании vision/analysis задан `OPENAI_API_KEY` (или `AI_ANALYSIS_URL`); после деплоя проверить копилот/анализ.
- [ ] **Debug** — в production не заданы `DEBUG_AUTH`, `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES` (или они отключены).

---

## Заметка по favicon

В `app/layout.tsx` в `metadata.icons` указаны `/brand/aistroyka-icon.svg` и `/favicon.ico`. Файл `apps/web/public/favicon.ico` в репозитории может отсутствовать. Для полной поддержки фавикона добавьте `favicon.ico` в `apps/web/public/`. До этого браузер может использовать только SVG-иконку или дефолт.
