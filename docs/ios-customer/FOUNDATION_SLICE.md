# Customer iOS foundation slice (2026-10-03)

**Status:** FIRST EXECUTABLE SLICE — not product-complete  
**ADR:** `docs/architecture/ADR-0010-CUSTOMER-IOS-TARGET.md`  
**Branch intent:** `feature/customer-ios-foundation-2026-10-03`

## What this slice ships

- Xcode target `AiStroykaCustomer` (`ai.aistroyka.customer`)
- Shared networking (`x-client: ios_customer`) and Shared auth (email/password, Apple, Google PKCE)
- Session restore via `AuthService` + `GET /api/v1/me`
- Role gate: only `stakeholder` continues into the authenticated shell; contractor roles are told to use Manager
- Logout, loading/error/empty states, EN/RU/ES/IT strings, dark/gold tokens
- Login-surface UITest identifiers (`pilot_customer_*`)
- Web `ClientProfile` accepts `ios_customer` and does **not** treat it as a lite worker

## Explicitly not in this slice

- Portal project list / timeline / documents / evidence
- Store upload (OWNER_GATE)
- Android Customer
- Fake demo backend

Do not claim the Customer app complete after this login shell.
