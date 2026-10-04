# ADR-0010 — Customer iOS target (AIS-OWNER-002)

**Status:** ACCEPTED as implementation direction — first executable slice in progress  
**Date:** 2026-10-03  
**Depends:** AIS-OWNER-001 portal contracts; Shared auth/network; customer-finance isolation  
**Does not:** merge Manager and Worker; expand the live contractor-ops-only production pilot automatically

## Decision

Add a **third native iOS application** (`AiStroykaCustomer`) that reuses `ios/Shared` auth (email + `AuthOAuthProvider` Apple/Google PKCE), API client, and domain DTOs.

Do **not** create a separate backend. Customer APIs are the existing portal/client-request/document/evidence routes with the customer-finance projection applied **before** any AI context assembly.

Android Customer parity is later (same DEFERRED_BY_DECISION policy as first-pilot Android unless reversed).

## Inventory (current main `bfcfe93a` plus this slice)

| Target | Exists |
|--------|--------|
| AiStroykaManager | YES |
| AiStroykaWorker | YES |
| AiStroykaCustomer | YES — login/auth shell only |
| Web `/portal` | YES (not certified READY) |
| Web self-serve intake workspace | NO |

## Minimum product (after portal E2E)

Registration/login → project/request list → progress/timeline → permitted evidence → documents → approvals/decisions → notifications/deep links → account/settings.

Async intake (AIS-CLIENT-005A) and live intake (AIS-CLIENT-005B) land after evidence/graph dependencies. Matching is later.

## Distribution

Separate bundle ID `ai.aistroyka.customer`. App Store upload remains OWNER_GATE. Do not claim store presence from a compile.

## Security

Server-derived tenant/project/role only. Revoked membership and expired sessions fail closed. No internal contractor costs/margin in UI, exports, notification previews, or AI summaries.

## Next code slice

1. Xcode target + Shared package dependency + login shell.  
2. Read-only project list against portal APIs.  
3. Evidence/progress screens.  
4. Intake only after AIS-CLIENT-005A API exists.
