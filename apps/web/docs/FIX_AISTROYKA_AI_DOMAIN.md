# Домен aistroyka.ai не работает — что сделать

При деплое появилась ошибка: **«aistroyka.ai is already assigned to another worker»** (привязан к другому Worker или к «null»). Нужно освободить домен и привязать его к **aistroyka-web-production**.

---

## Вариант A: Автоматически (скрипт + деплой)

1. Создайте API-токен Cloudflare — см. **инструкцию ниже** («Как получить API-токен на сайте Cloudflare»).
2. В каталоге `apps/web` создайте файл **`.env.cf`** (он в .gitignore, не попадёт в репозиторий):
   ```bash
   CLOUDFLARE_API_TOKEN=ваш_токен
   ```
3. Выполните:
   ```bash
   cd apps/web
   npm run cf:fix-domain
   npm run cf:deploy:prod
   ```
   Скрипт удалит конфликтующие маршруты в зоне; деплой привяжет домены из `wrangler.toml` к **aistroyka-web-production**.
4. Проверьте https://aistroyka.ai и https://www.aistroyka.ai.

---

## Вариант B: Вручную в Dashboard

### Шаг 1: Освободить маршрут aistroyka.ai

1. Откройте [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**.
2. Перейдите в зону **aistroyka.ai** (левое меню: **Websites** → **aistroyka.ai**).
3. В левом меню зоны: **Workers Routes** (или **Workers** → **Overview** → вкладка **Routes** / **Triggers**).
4. Найдите маршрут **aistroyka.ai** (или **aistroyka.ai/**) и посмотрите, к какому Worker он привязан.
5. **Удалите** этот маршрут или **измените** привязку так, чтобы маршрута не было (потом мы привяжем домен к нужному Worker).

Либо:

- **Workers & Pages** → список Workers → откройте любой другой Worker, у которого в **Settings** → **Triggers** / **Domains & Routes** указан **aistroyka.ai** → удалите этот домен/маршрут.

Цель: чтобы **aistroyka.ai** и **www.aistroyka.ai** нигде не были привязаны к другому Worker.

---

### Шаг 2: Привязать домен к aistroyka-web-production (Custom Domain)

1. **Workers & Pages** → выберите Worker **aistroyka-web-production**.
2. **Settings** → блок **Triggers** → **Custom Domains** → **Add Custom Domain**.
3. Введите **aistroyka.ai** → сохраните.
4. Повторите: **Add Custom Domain** → **www.aistroyka.ai** → сохраните.

Cloudflare сам создаст DNS-записи и сертификат для этих имён (если зона aistroyka.ai в этом же аккаунте).

---

### Шаг 3: Проверить DNS зоны aistroyka.ai

1. В Dashboard: **Websites** → **aistroyka.ai** → **DNS** → **Records**.
2. Должны быть записи для **aistroyka.ai** и **www.aistroyka.ai** (их мог создать шаг 2).
3. Если зоны aistroyka.ai в Cloudflare ещё нет:
   - **Websites** → **Add a site** → введите **aistroyka.ai**.
   - У регистратора домена смените NS на те, что покажет Cloudflare (например `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).

---

### Шаг 4: Проверка

Подождите 2–5 минут и откройте в браузере:

- **https://aistroyka.ai**
- **https://www.aistroyka.ai**

Должен открываться ваш сайт (редирект на вход, если не залогинены).

---

## Как получить API-токен на сайте Cloudflare

1. Откройте в браузере: **https://dash.cloudflare.com**
2. Войдите в аккаунт (тот, где добавлен домен aistroyka.ai).
3. Справа вверху нажмите на **иконку профиля** (аватар/круг) → выберите **My Profile** (Мой профиль).
4. В левом меню нажмите **API Tokens** (или перейдите по прямой ссылке: **https://dash.cloudflare.com/profile/api-tokens**).
5. Нажмите кнопку **Create Token** (Создать токен).
6. Можно взять готовый шаблон:
   - найдите **Edit zone DNS** или **Workers Routes** и нажмите **Use template**,  
   или создать свой:
   - нажмите **Create Custom Token**.
   - **Token name:** например `aistroyka-deploy`.
   - **Permissions:** добавьте по одной:
     - **Zone** → **Zone** → **Read**;
     - **Zone** → **Workers Routes** → **Edit**.
   - **Zone Resources:** выберите **Include** → **Specific zone** → **aistroyka.ai**.
   - Остальное можно не менять.
7. Нажмите **Continue to summary** → **Create Token**.
8. **Скопируйте токен** (длинная строка) и сразу сохраните в надёжное место — второй раз его не покажут.  
   Этот токен вставьте в файл `apps/web/.env.cf`:
   ```bash
   CLOUDFLARE_API_TOKEN=скопированный_токен
   ```

---

## Если зона aistroyka.ai в другом аккаунте Cloudflare

Тогда Custom Domain для Worker в текущем аккаунте создать нельзя. Варианты:

- Перенести зону aistroyka.ai в тот же аккаунт, где развёрнут Worker, и повторить шаги 1–2.
- Либо в зоне, где лежит aistroyka.ai, вручную создать CNAME: **www** → **aistroyka-web-production.z6pxn548dk.workers.dev** (для корня **aistroyka.ai** обычно нужен A/AAAA или CNAME flattening в Cloudflare).
