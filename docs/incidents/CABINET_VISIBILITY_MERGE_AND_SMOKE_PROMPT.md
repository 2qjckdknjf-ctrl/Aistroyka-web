# Промт для следующего шага: merge PR #13 + живой смоук кабинета

Скопируйте блок ниже в Cursor (или передайте оператору).

---

**Задача.** PR **#13**, ветка `chore/deep-production-completion`: GitHub **CI Check** и **Workers Builds** уже зелёные; нужно **операционное закрытие** инцидента cabinet visibility — **без** расширения scope, **без** mobile.

1. **Merge**  
   - Смерджить PR #13 в `main` согласно политике репозитория (merge / squash).  
   - Без force-push, без rewrite истории.

2. **Live smoke** после деплоя на **Cloudflare** (staging или production — тот хост, где смотрите релиз):

   - Переменная: `BASE_URL=https://<ваш-хост>` (без завершающего `/`).

   ```bash
   BASE_URL=https://<ваш-хост> bash scripts/smoke/dashboard_cabinet_smoke.sh
   ```

   - В браузере (гость): публичная страница → CTA кабинета → `/dashboard` → ожидается цепочка к **логину** с сохранённым `next` (локализованный путь).  
   - После логина **без** `?next` — ожидание **`/{locale}/dashboard`**, а не неожиданного ухода на `/subscribe`, если ожидается кабинет.  
   - Пилот: tenant в billing pilot cohort (**DB** `billing_pilot_workspaces` или **env** `BILLING_PILOT_WORKSPACE_IDS`) или обход gate (`SUBSCRIPTION_GATE_DASHBOARD=pilot|bypass|off`) — кабинет **должен** быть доступен там, где это задокументировано.

3. **Документация**  
   Обновить `docs/incidents/CABINET_VISIBILITY_AND_DASHBOARD_STABILITY_CLOSURE.md`:  
   - дата и среда смоука;  
   - ссылка или id прогона деплоя при необходимости;  
   - строка **Operational closure: DONE** если всё подтверждено.

4. Если смоук падает — **только минимальный** фикс в `apps/web`, повторить CI и смоук.

---

**Ссылки в репо.**  
- Отчёт закрытия: `docs/incidents/CABINET_VISIBILITY_AND_DASHBOARD_STABILITY_CLOSURE.md`  
- Скрипт HTTP-проб: `scripts/smoke/dashboard_cabinet_smoke.sh`
