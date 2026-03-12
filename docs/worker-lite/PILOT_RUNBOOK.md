# Worker Lite — Пилотный запуск

## Что уже сделано в репозитории

- Конфиг: в `ios/Config/` создан **Secrets.xcconfig** (копия примера). Он в .gitignore — в репо не попадёт.
- Пуш: в **AiStroykaWorker.entitlements** добавлен `aps-environment` = development — приложение готово к регистрации устройства для push (бэкенд и APNs нужно настроить отдельно).
- Документация: README в `ios/Config/` обновлён (инструкция для пилота).

## Что сделать у себя

### 1. Конфиг

Если `ios/Config/Secrets.xcconfig` ещё не заполнен под твой бэкенд:

```bash
cd ios/Config
# если файла нет: cp Config.example.xcconfig Secrets.xcconfig
# отредактируй Secrets.xcconfig: подставь свой BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
```

Либо в Xcode: схема **AiStroykaWorker** → Edit Scheme → Run → Arguments → Environment Variables — добавь BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY.

### 2. Сборка и запуск

1. Открой `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` в Xcode.
2. Выбери схему **AiStroykaWorker**.
3. Выбери симулятор или подключённое устройство.
4. ⌘R (Run) или ⌘B (Build).

### 3. Дымовой чеклист на устройстве

Пройди сценарии из **08_QA_AND_DEVICE_SMOKE.md**: логин, повторный вход, задачи, смена, отчёт, фото, выгрузка, отправка, логаут, офлайн (и при необходимости — push).

### 4. Тесты (по желанию)

В Xcode: Product → Test (⌘U). Либо в терминале (когда симулятор доступен):

```bash
cd ios/AiStroykaWorker
xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,name=iPhone 15' test
```

---

После шагов 1–2 приложение должно собираться и запускаться; после шага 3 пилот считается проверенным на устройстве.
