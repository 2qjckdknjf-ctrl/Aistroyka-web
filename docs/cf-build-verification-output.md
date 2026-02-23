# Вывод проверки cf:build и package.json

## 1) Расположение package.json

| Команда | Результат |
|--------|-----------|
| **pwd** | `/Users/alex/Desktop/AISTROYKA/AISTROYKA-WEB` |
| **git rev-parse --show-toplevel** | `/Users/alex/Desktop/AISTROYKA/AISTROYKA-WEB` |
| **ls -la** | package.json в корне репозитория |
| **node -e "..."** | node: command not found (в среде выполнения) |

**package.json (первые 120 строк):**

```json
{
  "name": "aistroyka-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "cf:dev": "opennextjs-cloudflare preview",
    "cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion",
    "cf:deploy": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion && opennextjs-cloudflare deploy"
  },
  ...
}
```

---

## 2) Скрипт в package.json

- **cf:build** задан как:  
  `"cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"`

---

## 3) Локальная проверка (строка)

- **grep** в корне репозитория:  
  `"cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"`  
  Флаг присутствует в файле.

---

## 4) Коммит и пуш

- **git add package.json** — выполнен.
- **git commit** — не создан новый коммит (nothing to commit, рабочая копия совпадает с HEAD).
- **git push** — не выполнялся (нет нового коммита).

---

## 5) Удалённая ветка и HEAD

| Команда | Результат |
|--------|-----------|
| **git log -1 --name-only** | Коммит 89f1371, сообщение "OpenNext: allow unsupported Next version in build", в коммите есть **package.json**. |
| **git show HEAD:package.json** | В коммите в scripts указано: `"cf:build": "opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"`. |
| **git ls-remote --heads origin main** | `89f1371ac07b78d8e8e73038a7626fd441c3f4f8 refs/heads/main` |

---

## Итог

- В корне репозитория и в коммите на **origin/main** в **package.json** скрипт **cf:build** содержит флаг **--dangerouslyUseUnsupportedNextVersion**.
- Если в логе Cloudflare по-прежнему видно `$ opennextjs-cloudflare build` без флага, значит в настройках сборки Cloudflare указана команда **opennextjs-cloudflare build**, а не запуск скрипта из package.json.
- Чтобы использовался флаг, в Cloudflare в качестве **Build command** нужно указать, например: **`bun run cf:build`** или **`npm run cf:build`**, а не `opennextjs-cloudflare build`.
