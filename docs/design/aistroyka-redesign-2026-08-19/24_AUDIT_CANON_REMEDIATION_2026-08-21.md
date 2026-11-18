# Design canon audit remediation — 2026-08-21

**Branch:** `design/audit-canon-remediation-2026-08-21`  
**Canon:** Memory OS `56263de1-d0a9-48b6-8275-e40df7391f5a` + graphite / yellow `#F5C518` / Liquid Glass

## Findings fixed

### Web
- Removed opaque `bg-white` / `text-white` on accent surfaces → tokens (`bg-aistroyka-surface`, `text-aistroyka-text-inverse`).
- Glass wraps for Next Actions, Executive Overview, Decision Simulation, Manager Action View, AI Copilot panel.
- Removed competing Overview quick-tab strip on Project Command Center.
- Project deep links → `/dashboard/projects/:id` (recent, list, portfolio).
- Portal-only: hide Telegram connect card.
- Dead `Card` imports removed; Next Actions i18n (en/ru/es/it).

### iOS
- Forced dark scheme + page background on Manager/Worker app roots.
- `onPrimary` → graphite `#0B0F19` (parity with web/Android yellow CTAs).
- Worker login uses semantic colors + graphite shell.
- `UIUserInterfaceStyle=Dark`; Worker status bar → LightContent.

### Android
- Worker XML theme: dark Material (was Light).
- Manager + Worker themes wire `aistroyka_*` primary/status/window colors.
- Added success/warning/on_primary color resources.
- `WorkerSemanticColors.success()` no longer aliases brand yellow.

## Deferred (documented, not in this PR)
- Full Liquid Glass materials on every iOS/Android card (shared glass component).
- Merging legacy `/projects/[id]` intelligence route into Command Center.
- Full portal-only shell chrome split.
- Bulk replace remaining UIKit `systemGroupedBackground` across Manager lists.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
bunx tsc --noEmit -p apps/web
```
