# Aistroyka Offline Handoff Kit (No Figma Dependency)

## Что сделано офлайн

- Подготовлены локальные макеты без зависимости от Figma:
  - `docs/design-system/offline-mockups/index.html`
  - `docs/design-system/offline-mockups/styles.css`
- Макеты включают:
  - Web: Public Home, Auth Login, Dashboard Overview
  - Mobile: Manager Home, Worker Report Flow
  - Component Library: Button, Input, Card, Badge, Alert
- Подготовлен machine-readable mapping для будущего Code Connect:
  - `docs/design-system/code-connect.offline.json`

## Как открыть макеты локально

1. Открой файл `docs/design-system/offline-mockups/index.html` в браузере.
2. Для точного сравнения с web-токенами можно сверять с:
   - `apps/web/app/design-tokens.css`
   - `apps/web/components/ui`

## Что покрыто по плану

- Единый визуальный язык зафиксирован (brand-first, dark + accent).
- Базовые экраны и компонентный слой представлены в автономном офлайн-формате.
- Подготовлен bridge к code-компонентам для последующего автоматического маппинга.

## Готовый bridge для Code Connect

В `docs/design-system/code-connect.offline.json` уже заданы связи:

- `Button` -> `apps/web/components/ui/Button.tsx`
- `Input` -> `apps/web/components/ui/Input.tsx`
- `Card` -> `apps/web/components/ui/Card.tsx`
- `Badge` -> `apps/web/components/ui/Badge.tsx`
- `Alert` -> `apps/web/components/ui/Alert.tsx`

Когда Figma Code Connect станет доступен, эти mapping можно применить батчем без повторного анализа.

## Следующий шаг (тоже могу сделать сам)

- Перенести офлайн-макеты в реальный UI-слой `apps/web` (Wave A):
  - нормализация legacy variables,
  - унификация использования `components/ui`,
  - обновление public/auth/dashboard поверхностей без изменения логики auth/tenant.
