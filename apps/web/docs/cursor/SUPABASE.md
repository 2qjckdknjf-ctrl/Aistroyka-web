# Supabase: версионирование и работа с миграциями

## Где хранятся миграции

- **Этот репо (Aistroyka-web):** папка `supabase/` — для конфига и при необходимости миграций, специфичных для веб-приложения. Сейчас миграции основного бэкенда живут в **engine/Aistroyk/supabase/** (в том же монорепо).
- Любые изменения схемы/функций должны быть в виде файлов в `supabase/migrations/` (здесь или в engine) и закоммичены.

## Установка Supabase CLI

```bash
# npm (глобально)
npm install -g supabase

# или через Homebrew (macOS)
brew install supabase/tap/supabase
```

Проверка: `supabase --version`.

## Секреты не в git

- `.env` и `supabase/.env` не коммитить. В `.gitignore` уже есть `.env`, `.env.*` (кроме примеров).
- Добавьте в корень или в `supabase/` файл `.env.example` с переменными без значений (см. существующий `.env.example` в корне приложения).

## Как подтянуть схему из облачного проекта (для dev)

Если у вас есть проект в Supabase Dashboard и нужно получить текущую схему:

```bash
supabase link --project-ref <project-ref>
supabase db pull
```

Это создаст миграцию в `supabase/migrations/`. Закоммитьте её.

## Как применить миграции (push)

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Либо через Dashboard → SQL Editor выполнять миграции вручную, но предпочтительно — через CLI и версионированные файлы.

## Локальный Supabase (опционально)

```bash
supabase start
```

Требует Docker. Документация: https://supabase.com/docs/guides/cli/local-development .

## Структура в репозитории

```
supabase/
  config.toml     # при необходимости, не коммитить секреты
  migrations/     # все SQL-миграции с timestamp в имени
  .env.example    # шаблон переменных (если нужны отдельные для supabase)
```

Секреты — только в `.env` (локально), не в git.
