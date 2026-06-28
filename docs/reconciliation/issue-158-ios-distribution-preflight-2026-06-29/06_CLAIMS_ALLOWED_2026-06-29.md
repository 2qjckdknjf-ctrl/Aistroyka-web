# Claims Allowed

Based strictly on captured preflight evidence:

| Claim | Verdict | Basis |
|---|---|---|
| iOS apps compile and archive structurally (no-sign) | **YES** | Manager + Worker `ARCHIVE SUCCEEDED` (CODE_SIGNING_ALLOWED=NO) |
| Bundle IDs / Team correct | **YES** | `ai.aistroyka.manager` / `ai.aistroyka.worker`, Team `43A4KW5BKB` |
| AppIcon present at required source size | **YES** | single-size 1024×1024 universal; Xcode generates 120/152 |
| TestFlight readiness | **OWNER_ACTION_REQUIRED** | needs Distribution cert + ASC auth/API key; capabilities decision |
| App Store readiness | **OWNER_ACTION_REQUIRED** | above + store metadata/screenshots/privacy declarations |
| pilot-live | **NO** | not claimed |
| production GA | **NO** | not claimed |
| upload performed | **NO** | no TestFlight/App Store upload attempted |
| signing/cert/profile changes | **NO** | inspection only |

## NOT claimed

- TestFlight readiness READY — not asserted.
- App Store readiness READY — not asserted.
- pilot-live — not asserted.
- production GA — not asserted.
- Push Notifications / Sign in with Apple configured — they are absent.
