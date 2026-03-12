# Отчёт: Enterprise Product Layer — Aistroyka.ai

**Дата:** 2026-03-11  
**Цель:** Добавить продуктовый слой для enterprise: AI Demo, Case Studies, Documentation, Trust (Security), Platform, улучшение главной страницы и метрик.

---

## 1. Новые страницы

| Путь | Описание |
|------|----------|
| `/ai-demo` | Интерактивное демо ИИ: hero, загрузка фото (mock), блок результатов (Detected elements, Progress analysis, Risk detection, Delay prediction, AI summary), секция AI capabilities. |
| `/cases` | Список кейсов: карточки Residential, Commercial, Infrastructure, Renovation с project size, team size, timeline, benefits. |
| `/cases/[slug]` | Страница кейса по slug: residential, commercial, infrastructure, renovation. |
| `/projects-showcase` | Showcase продукта: блоки Dashboard, AI analytics, Progress tracking, Mobile reporting (с плейсхолдерами под скриншоты). |
| `/docs` | Help Center: список разделов (Getting started, Projects, Tasks, Reports, AI analytics, Mobile apps, Users and roles). |
| `/docs/[slug]` | Статья документации по slug (getting-started, projects, tasks, reports, ai-analytics, mobile-apps, users-and-roles). |
| `/security` | Trust layer: Data protection, AI safety, Infrastructure reliability, Supabase security, Cloudflare protection. |
| `/platform` | Экосистема продукта: Web platform, Manager app, Worker app, AI engine, Integrations. |

Все страницы доступны по `/{locale}/...` (ru, en, es, it). Dashboard и auth не изменялись.

---

## 2. Структура

### Маршруты
- Все новые страницы находятся в группе **`(public)`**: `app/[locale]/(public)/...`.
- Динамические: `cases/[slug]`, `docs/[slug]` с `generateStaticParams` для всех локалей и slug.

### Компоненты
- **`ai-demo/AiDemoSimulator.tsx`** — клиентский компонент: выбор файла (фото), mock-состояния «analyzing» / «results», отображение mock Detected elements, Progress analysis, Risk detection, Delay prediction, AI summary. Данные на сервер не отправляются.

### i18n
- В **`public`** добавлены ключи: `nav` (aiDemo, cases, docs, platform, security, projectsShowcase), `aiDemo`, `cases`, `projectsShowcase`, `docs`, `security`, `platform`, `homeMetrics`.
- Локали **en**, **ru** — полный контент; **es**, **it** — те же ключи с переводами, чтобы не было MISSING_MESSAGE при сборке.

### Главная страница
- **Hero:** добавлена кнопка «Try AI demo» и блок **Product preview** (три карточки: Dashboard, AI insights, Mobile) со ссылками на `/projects-showcase`, `/ai-demo`, `/mobile`.
- **Метрики:** новый блок «Construction control metrics» с mock-значениями (500+ projects, 12K+ reports, 8K+ insights, 45K+ photos) и подписями из `public.homeMetrics`.

### Навигация
- **Header:** в `NAV_LINKS` добавлены `/ai-demo` (aiDemo), `/docs` (docs); отображаются первые 8 ссылок.
- **Footer:** колонка **Product** дополнена ai-demo и platform; добавлена колонка **Resources** (Cases, Docs, Projects showcase, Security). Сетка футера: 5 колонок (Brand, Product, Resources, Company, Legal).

### SEO
- **Sitemap:** в `PUBLIC_PATHS` добавлены пути: ai-demo, cases, cases/residential|commercial|infrastructure|renovation, docs, docs/getting-started|projects|tasks|reports|ai-analytics|mobile-apps|users-and-roles, projects-showcase, platform, security.

---

## 3. Изменённые файлы

### Изменённые
- `apps/web/messages/en.json` — новые ключи в `public` (nav, aiDemo, cases, projectsShowcase, docs, security, platform, homeMetrics).
- `apps/web/messages/ru.json` — то же для ru.
- `apps/web/messages/es.json` — новые ключи `public` (минимальный набор для сборки).
- `apps/web/messages/it.json` — то же для it.
- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` — hero (Try AI demo, product preview strip), блок метрик.
- `apps/web/components/public/PublicHeader.tsx` — NAV_LINKS (ai-demo, docs), slice(0, 8).
- `apps/web/components/public/PublicFooter.tsx` — PRODUCT_LINKS (ai-demo, platform), RESOURCE_LINKS, колонка Resources, сетка lg:grid-cols-5.
- `apps/web/app/sitemap.ts` — расширенный PUBLIC_PATHS.

### Новые
- `apps/web/app/[locale]/(public)/ai-demo/page.tsx`
- `apps/web/app/[locale]/(public)/ai-demo/AiDemoSimulator.tsx`
- `apps/web/app/[locale]/(public)/cases/page.tsx`
- `apps/web/app/[locale]/(public)/cases/[slug]/page.tsx`
- `apps/web/app/[locale]/(public)/projects-showcase/page.tsx`
- `apps/web/app/[locale]/(public)/docs/page.tsx`
- `apps/web/app/[locale]/(public)/docs/[slug]/page.tsx`
- `apps/web/app/[locale]/(public)/security/page.tsx`
- `apps/web/app/[locale]/(public)/platform/page.tsx`

### Не изменялись
- Middleware, auth flow, dashboard layout, API routes, Supabase, защищённые префиксы.

---

## 4. Архитектура

- **Изоляция:** весь новый контент в `(public)`; dashboard и auth не трогались.
- **Статика:** все перечисленные страницы собираются через `generateStaticParams` по локалям (и по slug для cases/docs).
- **Демо ИИ:** полностью на клиенте, mock-результаты; при появлении backend можно заменить вызов в `AiDemoSimulator` на реальный API.
- **Документация:** контент статический (один абзац на статью); при необходимости можно вынести в CMS или MDX.

---

## 5. Результаты тестов

- **Build:** `npm run build` — успешен (238 static pages, включая все новые по локалям и slug).
- **Typecheck:** в рамках `next build` — без ошибок.
- **Lint:** `npm run lint` — без предупреждений и ошибок.

Проверено:
- Роутинг: новые маршруты доступны по `/{locale}/ai-demo`, `/{locale}/cases`, `/{locale}/cases/residential` и т.д.
- Dashboard и auth не затронуты (маршруты и layout без изменений).

---

## 6. Рекомендации следующих шагов

1. **AI Demo:** при готовности backend — заменить mock в `AiDemoSimulator` на вызов реального API анализа фото (с сохранением текущего UX и обработки ошибок).
2. **Case studies:** при наличии реальных кейсов — заменить статический `CASE_DATA` на данные из CMS или API, при необходимости добавить изображения и более длинные тексты.
3. **Projects showcase:** подставить реальные скриншоты дашборда, ИИ-аналитики и мобильных отчётов вместо плейсхолдеров «Product preview».
4. **Documentation:** расширить тексты статей, при необходимости — MDX или внешний хостинг документации с ссылками из `/docs`.
5. **Метрики на главной:** при наличии реальных агрегатов — заменить mock (500+, 12K+ и т.д.) на данные из API или конфига.
6. **Локализация:** при приоритете es/it — доработать и вычитать переводы новых ключей `public`.

---

Итог: enterprise product layer добавлен изолированно; сборка и линт проходят; отчёт зафиксирован в `docs/REPORT-ENTERPRISE-PRODUCT-LAYER.md`.
