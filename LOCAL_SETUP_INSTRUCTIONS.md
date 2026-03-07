# Инструкция: Как увидеть Android папки локально

## Проблема: Папки не видны на локальном компьютере

## Решение: Пошаговая инструкция

### Шаг 1: Откройте терминал на Mac

Нажмите `Cmd + Space`, введите "Terminal" и откройте его.

### Шаг 2: Перейдите в директорию проекта

```bash
cd /Users/alex/Projects/AISTROYKA
```

### Шаг 3: Проверьте текущую ветку

```bash
git branch
```

Вы должны увидеть список веток. Если вы не на ветке `cursor/android-platform-launch-b8bb`, переключитесь:

```bash
git checkout cursor/android-platform-launch-b8bb
```

Если ветки не существует локально, создайте её:

```bash
git fetch origin
git checkout -b cursor/android-platform-launch-b8bb origin/cursor/android-platform-launch-b8bb
```

### Шаг 4: Получите последние изменения

```bash
git pull origin cursor/android-platform-launch-b8bb
```

Или просто:

```bash
git pull
```

### Шаг 5: Проверьте, что папки появились

```bash
ls -la
```

Вы должны увидеть папку `android/`

```bash
ls android/
```

Вы должны увидеть:
- `shared/`
- `worker/`
- `manager/`

### Шаг 6: Откройте проект в Cursor/VS Code

1. Откройте Cursor
2. `File → Open Folder...`
3. Выберите `/Users/alex/Projects/AISTROYKA`
4. В левой панели (Explorer) вы увидите все папки

## Альтернативный способ: Проверка через Finder

1. Откройте Finder
2. Перейдите в `/Users/alex/Projects/AISTROYKA`
3. Должна быть видна папка `android/`

## Если папки все еще не видны

### Проверка 1: Убедитесь, что вы в правильной директории

```bash
pwd
```

Должно показать: `/Users/alex/Projects/AISTROYKA`

### Проверка 2: Проверьте статус git

```bash
git status
```

### Проверка 3: Проверьте, что ветка правильная

```bash
git branch --show-current
```

Должно показать: `cursor/android-platform-launch-b8bb`

### Проверка 4: Принудительно обновите

```bash
git fetch origin
git reset --hard origin/cursor/android-platform-launch-b8bb
```

⚠️ **Внимание**: Эта команда удалит локальные изменения, если они есть!

### Проверка 5: Проверьте наличие файлов в репозитории

```bash
git ls-tree -r --name-only HEAD | grep android
```

Это покажет все файлы Android в репозитории.

## Быстрая команда (все в одной строке)

```bash
cd /Users/alex/Projects/AISTROYKA && git fetch origin && git checkout cursor/android-platform-launch-b8bb 2>/dev/null || git checkout -b cursor/android-platform-launch-b8bb origin/cursor/android-platform-launch-b8bb && git pull && ls -la android/
```

## Что должно быть в папке android/

После успешного pull вы должны увидеть:

```
android/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── shared/
│   ├── api-client/
│   ├── auth/
│   ├── config/
│   ├── device-context/
│   ├── dto/
│   ├── error-mapping/
│   ├── logging/
│   ├── notifications/
│   ├── repositories/
│   └── tenant-context/
├── worker/
│   ├── build.gradle.kts
│   └── src/
└── manager/
    ├── build.gradle.kts
    └── src/
```

## Если ничего не помогло

1. Убедитесь, что у вас есть доступ к репозиторию GitHub
2. Проверьте, что вы авторизованы в git:
   ```bash
   git config --global user.name
   git config --global user.email
   ```
3. Попробуйте клонировать репозиторий заново в другую папку для проверки
