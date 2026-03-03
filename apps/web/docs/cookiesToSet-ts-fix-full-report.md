# Полный отчёт: исправление TS-ошибки cookiesToSet (Cloudflare build)

**Дата отчёта:** 2026-02-23  
**Цель:** Устранение ошибки сборки на Cloudflare из-за неявного типа `any` у параметра `cookiesToSet` в `lib/supabase/server.ts`.

---

## 1. Проблема

- **Ошибка:** `./lib/supabase/server.ts:17:16 — Parameter 'cookiesToSet' implicitly has an 'any' type.`
- **Причина:** В адаптере cookies для Supabase SSR метод `setAll(cookiesToSet)` не имел явного типа, при включённом strict TypeScript это даёт ошибку.

---

## 2. Внесённые изменения

### 2.1. `lib/supabase/server.ts`

- Добавлен тип в начале файла (после импортов):

```ts
type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };
```

- Сигнатура метода изменена на:

```ts
setAll(cookiesToSet: CookieToSet[]) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options as any)
    );
  } catch {
    // ignore in Server Components
  }
}
```

- Логика не менялась; приведение `options as any` оставлено только на границе вызова `cookieStore.set`.

### 2.2. Доказательство в сборке (proof)

- **Скрипт:** `scripts/print-server-ts-head.cjs`  
  - Читает `lib/supabase/server.ts`, берёт первые 60 строк.  
  - Пишет их в файл `build-server-ts-head.log` в корне проекта.  
  - Дублирует вывод в консоль (видно в логе сборки Cloudflare).

- **Команда сборки** в `package.json`:

```json
"cf:build": "node scripts/print-server-ts-head.cjs && opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"
```

- В логе сборки и в `build-server-ts-head.log` видно, какой именно `server.ts` попал в сборку.

### 2.3. Игнорирование артефакта

- В `.gitignore` добавлено: `build-server-ts-head.log`, чтобы артефакт не коммитился.

---

## 3. Уникальность вхождения

По репозиторию (только отслеживаемые `.ts`):

| Файл | Строка | Сигнатура |
|------|--------|-----------|
| `lib/supabase/server.ts` | 19 | `setAll(cookiesToSet: CookieToSet[])` |
| `lib/supabase/middleware.ts` | 22 | `setAll(cookiesToSet: CookieToSet[])` |

Других вхождений `setAll(cookiesToSet` в отслеживаемых `.ts` нет. Файлы вида `server 2.ts` / `middleware 2.ts` не в git и в сборку не попадают.

---

## 4. Коммиты

```
6046ac6 Fix server.ts cookiesToSet typing + print proof in CF build
2695de4 Add CF build and root check docs
1d19e0f Fix TS: type cookiesToSet in Supabase server adapter
```

В коммите `6046ac6` изменены:
- `lib/supabase/server.ts`
- `package.json`
- добавлен `scripts/print-server-ts-head.cjs`

---

## 5. Текущее содержимое `lib/supabase/server.ts` (актуально на момент отчёта)

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function createClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // ignore in Server Components
          }
        },
      },
    }
  );
}
```

---

## 6. Проверка локально

- Сборка Next: `bun run build` или `npm run build`
- Сборка под Cloudflare: `bun run cf:build` или `npm run cf:build`  
  После этого в корне появляется `build-server-ts-head.log` с заголовком `server.ts`.

---

## 7. Итог

- Тип `CookieToSet` и сигнатура `setAll(cookiesToSet: CookieToSet[])` зафиксированы в `lib/supabase/server.ts`.
- В сборке CF выполняется proof-скрипт: вывод в консоль и в `build-server-ts-head.log`.
- По логу сборки и файлу можно убедиться, что собирается правильная версия файла.

Если ошибка на Cloudflare сохраняется, по блоку `===SERVER.TS HEAD===` в логе сборки или по `build-server-ts-head.log` можно проверить, что именно видит компилятор.
