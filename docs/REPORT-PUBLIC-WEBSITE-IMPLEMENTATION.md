# Отчёт: реализация публичного сайта Aistroyka.ai

**Дата:** 2026-03-11  
**Цель:** Добавить полноценную публичную маркетинговую часть сайта внутри текущего web-проекта без изменений в кабинете, auth, dashboard, backend и интеграциях.

---

## 1. Что было найдено в текущем проекте до начала работы

### Роутинг и структура
- **App Router** с сегментом `[locale]` (locales: `ru`, `en`, `es`, `it`), `localePrefix: "always"`.
- **Корень:** `/` редирект на `/{defaultLocale}` (ru). Страница `[locale]/page.tsx` редиректила: при наличии пользователя → `/dashboard`, иначе → `/login`. То есть **корень локали был защищён** и не показывал публичный контент.
- **Группы маршрутов:** `(dashboard)` — защищённый layout с `DashboardShell` и проверкой auth; `(auth)` — layout для login/register; отдельно `invite/accept` без группы.
- **Middleware:** `next-intl` + Supabase session; защита определялась как `pathWithoutLoc === "/"` или путь начинается с `PROTECTED_PREFIXES` (`/dashboard`, `/projects`, `/billing`, `/admin`, `/portfolio`). Auth-страницы (`/login`, `/register`) при наличии пользователя редиректят в dashboard.

### Layouts
- **Корневой layout:** `app/layout.tsx` — шрифт Plus_Jakarta_Sans, QueryProvider, globals.css, базовая metadata.
- **Locale layout:** `app/[locale]/layout.tsx` — NextIntlClientProvider, getMessages, setRequestLocale.
- **Dashboard layout:** требует auth, рендерит DashboardShell с сайдбаром и админ-навигацией.
- **Auth layout:** минимальный (BuildStamp в футере).

### i18n
- `next-intl` с `messages/{locale}.json`. В `en` и `ru` были полные ключи для nav, auth, dashboard, projects, team, errors; в `es` и `it` — те же пространства имён, но **не было секции `public`**.

### Дизайн и компоненты
- **Токены:** `app/design-tokens.css` и Tailwind theme (aistroyka-*): цвета, типографика, отступы, радиусы, тени.
- **Глобальные классы:** `.btn-primary`, `.btn-secondary`, `.card`, `.input-field` в `globals.css`.
- **Компоненты:** `DashboardShell`, `BuildStamp`, UI-кит (`Button`, `Input`, `Textarea`, `Alert`, `Card` и др.) в `components/ui`.

### API и формы
- Отдельного API для contact/demo не было. Есть множество API под dashboard, billing, worker, admin и т.д.

### SEO
- В корневом layout заданы только общие `title` и `description`. Отдельных sitemap/robots не было.

---

## 2. Что именно было создано/изменено

### Middleware
- **Изменён критерий защиты:** убрано условие `pathWithoutLoc === "/"`. Теперь защищены только пути из `PROTECTED_PREFIXES`. Корень локали (`/ru`, `/en` и т.д.) и все публичные пути (`/features`, `/pricing`, `/contact` и т.п.) доступны без авторизации.
- **Кэширование:** `Cache-Control: private, no-store` выставляется только для `isProtected` и `isAuthPage`, не для корня локали.

### Новая структура публичных страниц
- Введена **группа маршрутов `(public)`** под `[locale]`:
  - **Layout:** `app/[locale]/(public)/layout.tsx` — обёртка с `PublicHeader`, `PublicFooter` и JSON-LD (Organization, SoftwareApplication).
  - **Главная:** `app/[locale]/(public)/page.tsx` — при наличии пользователя редирект в `/{locale}/dashboard`, иначе рендер `PublicHomeContent`.
  - **Контент главной:** `PublicHomeContent.tsx` — hero, trust strip, pain points, solution overview, key modules, role-based blocks, AI section, mobile, pricing teaser, final CTA.
- Удалена прежняя **`app/[locale]/page.tsx`**, чтобы единственной страницей корня локали стала `(public)/page.tsx`.

### Компоненты
- **`components/public/PublicHeader.tsx`** — логотип (ссылка на `/`), навигация (features, solutions, ai-construction-control, mobile, pricing, about, contact, faq), кнопки «Request Demo» и «Log in», мобильное меню (бургер).
- **`components/public/PublicFooter.tsx`** — блоки Product, Company, Legal, копирайт.
- **`components/public/index.ts`** — реэкспорт.

### Публичные страницы (все под `[locale]/(public)/`)
- **`/`** — главная (уже описана).
- **`/features`** — возможности (project management, tasks, daily reports, photo/video, AI analytics, team roles, dashboards, integrations).
- **`/solutions`** — решения по ролям (developer, general contractor, contractor, project manager, field teams).
- **`/ai-construction-control`** — что анализирует ИИ, фото-воркфлоу, отклонения/риски, инсайты, human-in-the-loop.
- **`/mobile`** — приложение руководителя, приложение исполнителя, полевые сценарии, быстрые мобильные воркфлоу.
- **`/pricing`** — блоки Starter / Business / Enterprise с CTA «Request quote» и «Book demo».
- **`/about`** — миссия, проблема рынка, почему Aistroyka, надёжность/контроль/прозрачность.
- **`/contact`** — заголовок, форма контакта (имя, email, компания, сообщение), блок «Request a demo».
- **`/faq`** — список вопросов-ответов (что такое Aistroyka, для кого, как работает ИИ, мобильное приложение, тарифы).
- **`/privacy`** — страница политики конфиденциальности (структурированный placeholder с разделами 1–3).
- **`/terms`** — страница условий использования (структурированный placeholder с разделами 1–3).

### Формы и API
- **`app/api/contact/route.ts`** — POST, валидация через Zod (name, email, company?, message). При успехе возвращает `{ ok: true }`. Персистенция/отправка писем не реализована (оставлен TODO).
- **`app/[locale]/(public)/contact/ContactForm.tsx`** — клиентская форма: поля name, email, company, message, отправка в `/api/contact`, состояния idle/sending/success/error, валидация и сообщения об ошибках.

### i18n
- Добавлена секция **`public`** во все четыре локали:
  - **en, ru** — полный контент (nav, home, features, solutions, aiControl, mobile, pricing, about, contact, faq, privacy, terms, footer, form; в faq — whatIs, whoIsFor, howAi, mobile, pricing и ответы).
  - **es, it** — полный набор ключей `public` (испанский и итальянский переводы), чтобы не было MISSING_MESSAGE при генерации статики.

### SEO и технические страницы
- **Metadata:** у каждой публичной страницы свой `generateMetadata` (title, description); на главной добавлен openGraph (title, description).
- **Sitemap:** `app/sitemap.ts` — перечисляет все локали и публичные пути (корень, features, solutions, ai-construction-control, mobile, pricing, about, contact, faq, privacy, terms), baseUrl через `getAppUrl()`.
- **Robots:** `app/robots.ts` — allow `/`, disallow `/api/`, `/dashboard`, `/admin`, `/login`, `/register`, sitemap указывает на `/sitemap.xml`.
- **JSON-LD:** в `(public)/layout.tsx` добавлены Organization и SoftwareApplication для всех публичных страниц.

---

## 3. Какие страницы реализованы

| Путь (относительно локали) | Описание |
|----------------------------|----------|
| `/` | Главная: hero, trust, pain, solution, modules, roles, AI, mobile, pricing teaser, final CTA |
| `/features` | Карточки возможностей (8 блоков) |
| `/solutions` | Решения по ролям (5 блоков) |
| `/ai-construction-control` | 5 секций про ИИ-контроль |
| `/mobile` | 4 секции про мобильные приложения |
| `/pricing` | 3 тарифных блока + CTA |
| `/about` | 4 текстовых блока (mission, market, why, reliability) |
| `/contact` | Форма + блок «Request a demo» |
| `/faq` | 5 вопросов-ответов |
| `/privacy` | Placeholder юридического текста (3 раздела) |
| `/terms` | Placeholder юридического текста (3 раздела) |

Все страницы доступны по URL вида `/{locale}/...` (например `/ru/features`, `/en/contact`).

---

## 4. Как организован public layout и app layout

- **Публичная часть:** все маршруты в группе `(public)` используют один **Public layout**: верхний колонтитул (PublicHeader), основной контент, нижний колонтитул (PublicFooter). Auth не требуется. Отдельный layout только у публичной части, dashboard и auth не затронуты.
- **Закрытая часть:** без изменений. `(dashboard)/layout.tsx` по-прежнему проверяет сессию и рендерит DashboardShell; `(auth)/layout.tsx` — только обёртка для login/register.
- **Переходы:** с главной «Log in» ведёт на `/[locale]/login`, «Request Demo» — на `/[locale]/contact`. Из header/footer все ссылки идут через `@/i18n/navigation` (Link), т.е. с учётом текущей локали.

---

## 5. Какие формы и SEO-элементы добавлены

### Формы
- **Contact/Demo:** одна форма на `/contact` (имя, email, компания, сообщение). Отправка на `POST /api/contact`, валидация на сервере (Zod), на клиенте — состояния отправки, успеха и ошибки. Бэкенд пока только валидирует и возвращает 200; сохранение в БД/отправка email не делались.

### SEO
- **Metadata:** title и description у всех публичных страниц; на главной — openGraph title/description.
- **Sitemap:** `/sitemap.xml` со всеми локалями и публичными путями.
- **Robots:** `/robots.txt` с allow/disallow и ссылкой на sitemap.
- **JSON-LD:** Organization и SoftwareApplication в public layout. FAQPage не добавлялся (при необходимости можно добавить на страницу `/faq`).

---

## 6. Риски и TODO

### Риски
- **Contact API:** данные формы никуда не сохраняются и никому не отправляются. Нужна интеграция с БД, почтой или CRM.
- **getAppUrl() в sitemap/robots/layout:** зависит от конфига (NEXT_PUBLIC_APP_URL / hasSupabaseEnv). В средах без Supabase используется fallback `https://aistroyka.ai` — убедиться, что в проде задан правильный URL.
- **Privacy/Terms:** контент помечен как placeholder; перед продакшеном нужно заменить на финальные юридические тексты.

### TODO
- Реализовать сохранение или отправку заявок с формы contact (БД, email, CRM).
- При необходимости добавить rate limit на `POST /api/contact`.
- При желании — JSON-LD FAQPage на странице FAQ.
- Доработать переводы es/it при приоритете этих локалей (сейчас ключи есть, качество можно усилить).

---

## 7. Результаты build / typecheck / lint

- **Build:** `npm run build` завершается успешно (exit code 0). Генерируется 170 статических страниц, в списке маршрутов присутствуют публичные пути по всем локалям, а также `/robots.txt` и `/sitemap.xml`.
- **Typecheck:** выполняется в рамках `next build` — ошибок нет.
- **Lint:** `npm run lint` — без предупреждений и ошибок.

---

## 8. Список изменённых и добавленных файлов

### Изменённые
- `apps/web/middleware.ts` — убрана защита корня локали и лишний Cache-Control для `/`.
- `apps/web/messages/en.json` — добавлена секция `public` (nav, home, features, solutions, aiControl, mobile, pricing, about, contact, faq, privacy, terms, footer, form).
- `apps/web/messages/ru.json` — то же для русской локали.
- `apps/web/messages/es.json` — добавлена секция `public` (полный набор ключей).
- `apps/web/messages/it.json` — добавлена секция `public` (полный набор ключей).

### Удалённые
- `apps/web/app/[locale]/page.tsx` — заменён на `(public)/page.tsx` с логикой редиректа и главной.

### Новые
- `apps/web/components/public/PublicHeader.tsx`
- `apps/web/components/public/PublicFooter.tsx`
- `apps/web/components/public/index.ts`
- `apps/web/app/[locale]/(public)/layout.tsx`
- `apps/web/app/[locale]/(public)/page.tsx`
- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx`
- `apps/web/app/[locale]/(public)/features/page.tsx`
- `apps/web/app/[locale]/(public)/solutions/page.tsx`
- `apps/web/app/[locale]/(public)/ai-construction-control/page.tsx`
- `apps/web/app/[locale]/(public)/mobile/page.tsx`
- `apps/web/app/[locale]/(public)/pricing/page.tsx`
- `apps/web/app/[locale]/(public)/about/page.tsx`
- `apps/web/app/[locale]/(public)/contact/page.tsx`
- `apps/web/app/[locale]/(public)/contact/ContactForm.tsx`
- `apps/web/app/[locale]/(public)/faq/page.tsx`
- `apps/web/app/[locale]/(public)/privacy/page.tsx`
- `apps/web/app/[locale]/(public)/terms/page.tsx`
- `apps/web/app/api/contact/route.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`

---

## 9. Рекомендации на следующий этап

1. **Contact/Demo:** подключить сохранение заявок (таблица в Supabase или отправка в email/CRM) и при необходимости rate limit.
2. **Юридические страницы:** заменить placeholder-тексты на Privacy и Terms на утверждённые юридические версии.
3. **Контент и иллюстрации:** при наличии — добавить реальные скриншоты продукта, кейсы, логотипы партнёров в trust strip и секции решений.
4. **Аналитика и конверсии:** при необходимости — настроить события (например, «Request Demo», «Log in» с главной) в аналитике.
5. **Расширение контента:** при запросе — заложить основы для блога/case studies (маршруты и layout можно добавить в той же группе `(public)` или отдельной группе).
6. **Локализация:** доработать и вычитать тексты es/it, если эти рынки в приоритете.

---

Публичный сайт Aistroyka.ai реализован в текущей кодовой базе изолированно от кабинета и auth: маршруты, layout, компоненты и i18n готовы к продакшену с учётом описанных TODO и рисков.
