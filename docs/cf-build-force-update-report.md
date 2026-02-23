# Отчёт: принудительное обновление cf:build в package.json

## Что сделано

1. **Открыт package.json** в корне репозитория.

2. **Секция scripts заменена целиком на:**

   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"
   }
   ```
   Скрипты `lint`, `cf:dev` и `cf:deploy` удалены.

3. **Файл сохранён.**

4. **Выполнены команды:**
   - `git add package.json`
   - `git commit -m "Force update cf:build with unsupported Next flag"`
   - `git push origin main`
   - Результат пуша: `a973f01..6c2cbff  main -> main`

5. **Проверка (git show HEAD:package.json | grep cf:build):**
   ```
   "cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"
   ```

---

## Итог

В `package.json` на GitHub (коммит `6c2cbff`) скрипт **cf:build** гарантированно задан с флагом **--dangerouslyUseUnsupportedNextVersion**.
