# Отчёт: проверка корневой директории Cloudflare (CF root directory check)

## Что сделано

1. **Открыт package.json** в корне репозитория.

2. **Временно изменено поле name:**
   - Было: `"name": "aistroyka-web"`
   - Стало: `"name": "AISTROYKA-WEB-CF-CHECK"`

3. **Коммит и пуш:**
   - `git add package.json`
   - `git commit -m "CF root directory check"`
   - `git push origin main`
   - Результат: `89f1371..a973f01  main -> main`

4. **Последний коммит:**
   ```
   a973f01 CF root directory check
   ```

---

## Как проверить

После следующей сборки в Cloudflare посмотрите лог или вывод. Если в логе видно имя проекта **AISTROYKA-WEB-CF-CHECK**, значит Cloudflare использует **package.json из корня репозитория**. Если по-прежнему отображается **aistroyka-web**, сборка, скорее всего, идёт из другой директории или используется другой/кэшированный package.json.

После проверки можно вернуть имя в package.json на `aistroyka-web` и закоммитить изменение.
