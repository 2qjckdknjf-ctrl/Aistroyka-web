# Доступ к служебным функциям базы AISTROYKA

13 октября 2026 года read-only audit активной БД `vthfrxehrursfloevnlp` подтвердил EXECUTE для anon у 12 служебных SECURITY DEFINER функций. У `project_belongs_to_tenant(uuid,uuid)` это позволяет анонимно проверить существование пары project/tenant; семь trigger functions также имеют прямой client RPC доступ, хотя предназначены для вызова через триггеры. Остальные membership helpers проверяют auth.uid; их предупреждения сами по себе не доказывают эскалацию прав.

Новый SQL убирает PUBLIC/anon EXECUTE у пяти boolean helpers и сохраняет явные authenticated/service grants, необходимые RLS и текущим API. Семь trigger functions теряют прямой PUBLIC/anon/authenticated EXECUTE, service access сохранён. Тела, OIDs, существующие trigger bindings, RLS, table grants и применённые source migrations не меняются. Паттерн двух trigger revokes уже присутствовал в старой source migration `20260906123000`; текущая живая проверка установила оставшиеся разрешения. Новая миграция закрывает конкретный свежий набор без широкого повтора исторического SQL.

В изолированном PGlite 0.5.8 прошли **27 SQL проверок**. Harness читает последние реальные определения функций из миграций: воспроизводит анонимный existence lookup до исправления, проверяет права после него, сохранность тела/OID/trigger binding, идемпотентность повторного выполнения, разрешённое RLS чтение, освобождение dedupe terminal job и server-stamped confirmation. Отказы при подмене project/job/media, self-promotion и поддельном customer approval сохраняются. Service операции остаются доступны. Восемь receipt guard tests также PASS.

Harness добавлен в required CI для PGlite и отдельной пустой native PostgreSQL БД. Локальный native PostgreSQL binary на Mac имеет несовместимую архитектуру; локальный native PASS не заявляется. Required CI 38374397506 завершён SUCCESS на code HEAD d3b37133: 27 PGlite и 27 native PostgreSQL checks PASS, вместе с прочими required checks. Это isolated schema evidence; hosted apply не выполнялся.

```sh
cp scripts/ops/verify_private_helper_grants_postgres.mjs /path/to/isolated-runtime/helper-grants.mjs
node /path/to/isolated-runtime/helper-grants.mjs /absolute/path/to/repository
# Runtime dependencies: @electric-sql/pglite@0.5.8; pg@8.23.1 for loopback native mode.
```

Hosted SQL не применялся. До применения необходимы свежий history/receipt candidate preflight, проверка текущих определений/зависимостей, protected CI/review и существующие release gates. Staging и production используют общую БД, поэтому staging hostname сам по себе не даёт изоляции. [Правила permissions для функций Supabase](https://supabase.com/docs/guides/database/functions#function-privileges), [CREATE TRIGGER PostgreSQL](https://www.postgresql.org/docs/current/sql-createtrigger.html), [описание advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
