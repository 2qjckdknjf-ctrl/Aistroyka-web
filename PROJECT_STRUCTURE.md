# Структура проекта AISTROYKA

## Корневая структура

```
AISTROYKA/
├── android/                          # Android платформа
│   ├── shared/                       # Общие модули
│   ├── worker/                       # Worker приложение
│   └── manager/                      # Manager приложение
│
├── apps/
│   └── web/                          # Web приложение (Next.js)
│       ├── app/                      # Next.js App Router
│       ├── lib/                      # Библиотеки и утилиты
│       └── components/               # React компоненты
│
├── packages/
│   ├── contracts/                    # API контракты (Zod схемы)
│   ├── contracts-openapi/            # OpenAPI спецификация
│   └── api-client/                   # TypeScript API клиент
│
├── ios/
│   └── WorkerLite/                   # iOS Worker приложение
│
└── docs/
    └── android/                      # Android документация
```

## Детальная структура Android

```
android/
├── build.gradle.kts                  # Корневой build файл
├── settings.gradle.kts               # Настройки проекта
├── gradle.properties                # Свойства Gradle
│
├── shared/                           # Общие модули
│   ├── api-client/                   # Retrofit API клиент
│   │   └── src/main/java/com/aistroyka/shared/api/
│   │       ├── ApiClient.kt         # API интерфейс
│   │       └── RetrofitModule.kt    # DI модуль
│   │
│   ├── auth/                         # Аутентификация
│   │   └── src/main/java/com/aistroyka/shared/auth/
│   │       ├── AuthService.kt
│   │       └── TokenStorage.kt
│   │
│   ├── config/                       # Конфигурация
│   │   └── src/main/java/com/aistroyka/shared/config/
│   │       └── ConfigService.kt
│   │
│   ├── device-context/               # Device ID, idempotency
│   │   └── src/main/java/com/aistroyka/shared/device/
│   │       ├── DeviceIdProvider.kt
│   │       └── IdempotencyKeyGenerator.kt
│   │
│   ├── dto/                          # Data Transfer Objects
│   │   └── src/main/java/com/aistroyka/shared/dto/
│   │       ├── ProjectDto.kt
│   │       ├── TaskDto.kt
│   │       ├── ReportDto.kt
│   │       ├── WorkerDayDto.kt
│   │       ├── SyncDto.kt
│   │       ├── ConfigDto.kt
│   │       ├── AuthDto.kt
│   │       ├── MediaDto.kt
│   │       ├── AiDto.kt
│   │       └── DeviceDto.kt
│   │
│   ├── error-mapping/                # Обработка ошибок
│   │   └── src/main/java/com/aistroyka/shared/error/
│   │       ├── ApiError.kt
│   │       └── ApiErrorHandler.kt
│   │
│   ├── logging/                      # Логирование
│   │   └── src/main/java/com/aistroyka/shared/logging/
│   │       └── Logger.kt
│   │
│   ├── notifications/                # Push уведомления
│   │   └── src/main/java/com/aistroyka/shared/notifications/
│   │       └── PushNotificationService.kt
│   │
│   ├── repositories/                 # Репозитории + Room DB
│   │   └── src/main/java/com/aistroyka/shared/repository/
│   │       ├── TaskRepository.kt
│   │       ├── ProjectRepository.kt
│   │       ├── ReportRepository.kt
│   │       ├── WorkerDayRepository.kt
│   │       ├── SyncService.kt
│   │       ├── OperationQueue.kt
│   │       ├── OperationExecutor.kt
│   │       ├── OperationQueueProcessor.kt
│   │       ├── PhotoUploadService.kt
│   │       ├── NetworkMonitor.kt
│   │       ├── AppStateRepository.kt
│   │       ├── database/              # Room база данных
│   │       │   ├── AppDatabase.kt
│   │       │   ├── DatabaseModule.kt
│   │       │   ├── Converters.kt
│   │       │   ├── dao/
│   │       │   │   ├── OperationDao.kt
│   │       │   │   └── AppStateDao.kt
│   │       │   └── entity/
│   │       │       ├── OperationEntity.kt
│   │       │       └── AppStateEntity.kt
│   │       └── sync/                  # WorkManager
│   │           ├── SyncWorker.kt
│   │           └── SyncWorkManager.kt
│   │
│   └── tenant-context/               # Tenant контекст
│       └── src/main/java/com/aistroyka/shared/tenant/
│           └── TenantContext.kt
│
├── worker/                           # Worker Android приложение
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/aistroyka/worker/
│       │   ├── MainActivity.kt
│       │   ├── WorkerApplication.kt
│       │   └── ui/
│       │       ├── navigation/
│       │       │   └── WorkerNavigation.kt
│       │       ├── screens/
│       │       │   ├── login/
│       │       │   │   ├── LoginScreen.kt
│       │       │   │   └── LoginViewModel.kt
│       │       │   ├── home/
│       │       │   │   ├── HomeScreen.kt
│       │       │   │   └── HomeViewModel.kt
│       │       │   ├── task/
│       │       │   │   ├── TaskDetailScreen.kt
│       │       │   │   └── TaskDetailViewModel.kt
│       │       │   └── report/
│       │       │       ├── ReportCreateScreen.kt
│       │       │       └── ReportCreateViewModel.kt
│       │       └── theme/
│       │           └── Theme.kt
│       └── res/
│           └── values/
│               └── strings.xml
│
└── manager/                          # Manager Android приложение
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/aistroyka/manager/
        │   ├── MainActivity.kt
        │   ├── ManagerApplication.kt
        │   └── ui/
        │       ├── navigation/
        │       │   └── ManagerNavigation.kt
        │       ├── screens/
        │       │   ├── login/
        │       │   │   ├── LoginScreen.kt
        │       │   │   └── LoginViewModel.kt
        │       │   ├── dashboard/
        │       │   │   ├── DashboardScreen.kt
        │       │   │   └── DashboardViewModel.kt
        │       │   ├── projects/
        │       │   │   ├── ProjectsScreen.kt
        │       │   │   ├── ProjectsViewModel.kt
        │       │   │   ├── ProjectDetailScreen.kt
        │       │   │   └── ProjectDetailViewModel.kt
        │       │   ├── tasks/
        │       │   │   ├── TasksScreen.kt
        │       │   │   ├── TasksViewModel.kt
        │       │   │   ├── TaskDetailScreen.kt
        │       │   │   └── TaskDetailViewModel.kt
        │       │   ├── reports/
        │       │   │   ├── ReportsScreen.kt
        │       │   │   ├── ReportsViewModel.kt
        │       │   │   ├── ReportDetailScreen.kt
        │       │   │   └── ReportDetailViewModel.kt
        │       │   ├── team/
        │       │   │   ├── TeamScreen.kt
        │       │   │   └── TeamViewModel.kt
        │       │   ├── ai/
        │       │   │   ├── AiScreen.kt
        │       │   │   └── AiViewModel.kt
        │       │   └── theme/
        │       │       └── Theme.kt
        │       └── res/
        │           └── values/
        │               └── strings.xml
```

## Структура Web приложения

```
apps/web/
├── app/                              # Next.js App Router
│   ├── [locale]/                     # Локализация
│   │   └── (dashboard)/              # Dashboard роуты
│   │       └── dashboard/
│   │           └── page.tsx          # Dashboard страница
│   └── api/                          # API routes
│       └── v1/                       # API v1
│           ├── worker/               # Worker endpoints
│           ├── projects/             # Projects endpoints
│           ├── sync/                 # Sync endpoints
│           └── ...
│
├── lib/                              # Библиотеки
│   ├── domain/                       # Domain модели
│   ├── tenant/                       # Tenant контекст
│   ├── authz/                        # Авторизация
│   └── ...
│
└── components/                       # React компоненты
```

## Структура iOS

```
ios/
└── WorkerLite/
    └── WorkerLite/
        ├── HomeView.swift
        ├── ReportCreateView.swift
        ├── Services/
        │   ├── SyncService.swift
        │   ├── UploadManager.swift
        │   └── ...
        └── ...
```

## Документация

```
docs/
└── android/
    ├── ANDROID_ARCHITECTURE.md
    ├── ANDROID_PARITY_REPORT.md
    ├── WORKER_ANDROID_COMPLETION.md
    ├── MANAGER_ANDROID_COMPLETION.md
    ├── ANDROID_QA_REPORT.md
    ├── WORKER_ANDROID_SPEC.md
    ├── MANAGER_ANDROID_SPEC.md
    └── API_PARITY_REPORT.md
```

## Пакеты

```
packages/
├── contracts/                        # Zod схемы для API
│   └── src/schemas/
│       ├── projects.schema.ts
│       ├── sync.schema.ts
│       ├── config.schema.ts
│       └── ...
│
├── contracts-openapi/                # OpenAPI генерация
│   └── dist/
│       └── openapi.json
│
└── api-client/                       # TypeScript клиент
```

## Как просмотреть структуру локально

### В терминале:
```bash
# Показать все директории
find . -type d -not -path '*/\.*' -not -path '*/node_modules/*' | sort

# Показать структуру Android
tree android -L 3

# Показать все Kotlin файлы
find android -name "*.kt" | sort
```

### В VS Code / Cursor:
- Откройте папку проекта
- Используйте Explorer (Cmd+Shift+E на Mac)
- Все папки будут видны в дереве файлов
