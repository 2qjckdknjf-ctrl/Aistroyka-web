# Slice 01 evidence notes

## PD-P1-01 Login debug
- **Before:** audit pack `02_login_en_*` (copied as `01_before_login_en_*`) showing `Login step: idle`.
- **After:** local `NODE_ENV=production` `next start` captures `02_after_login_en_desktop.png`, `02_after_login_en_mobile.png`, `02_after_login_ru_desktop.png`.
- DOM `innerText` check: no `Login step` on EN/RU after fix.
- Note: raw HTML/RSC payload still contains `loginStep` i18n key in message bundles; that is not user-visible UI.

## PD-P1-03 Modal a11y
- Authenticated cabinet visual capture blocked (no synthetic session this run).
- Covered by Modal Escape/focus-trap/initial/restore implementation + `modal-focus.test.ts`.
- Persistence key unchanged: `aistroyka:first-launch-guide:v1`.

## PD-P2-01 / PD-P2-02
- `bun run --cwd apps/web check:design` PASS.
