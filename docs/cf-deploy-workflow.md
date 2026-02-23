# Cloudflare Workers — локальный деплой

## Инструменты

- **Node:** обязателен (`node -v`)
- **npm или bun:** для установки и скриптов
- **wrangler:** в `devDependencies`, вызывается через `npm run` / `bun run`

## Скрипты (package.json)

- `cf:build` — сборка под Cloudflare (OpenNext + proof server.ts head)
- `cf:deploy` — деплой в Workers (`wrangler deploy`)

## Первый запуск

### 1. Установка

```bash
npm install --legacy-peer-deps
# или
bun install
```

### 2. Авторизация wrangler

В **интерактивном** терминале (не в CI):

```bash
npx wrangler login
npx wrangler whoami
```

Либо задать токен (для CI/скриптов):

```bash
export CLOUDFLARE_API_TOKEN="<token>"
# Создать: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
```

### 3. Сборка

```bash
npm run cf:build
# или
bun run cf:build
```

### 4. Деплой

```bash
npm run cf:deploy
# или
bun run cf:deploy
```

После деплоя в выводе будет URL вида:  
`https://aistroyka-web.<account>.workers.dev`

## Проверка версий

```bash
node -v
bun -v   # опционально
npx wrangler --version
npx wrangler whoami
```
