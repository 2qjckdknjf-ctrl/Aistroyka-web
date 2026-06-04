# iOS Manager — AI API Parity Matrix

**Date:** 2026-06-04 (updated)  
**Client profile:** `x-client: ios_manager`  
**Verdict:** **YES** — intelligence + copilot stream wired; AI jobs inbox retained.

---

## Web canonical AI surfaces (apps/web)

| Surface | API | Live LLM |
|---------|-----|----------|
| Vision | `POST /api/v1/ai/analyze-image` | Yes (canonical gate) |
| Copilot stream | `POST /api/v1/projects/:id/copilot/chat/stream` | Yes |
| Project intelligence | `GET /api/v1/projects/:id/intelligence` | Brain + deterministic layers |
| AI jobs ledger | `GET /api/v1/ai/requests` | N/A |

---

## iOS Manager — current (implemented)

| Surface | Wired | Implementation |
|---------|-------|----------------|
| AI tab — jobs | **YES** | `AITabView` → `GET /api/v1/ai/requests` |
| Project intelligence | **YES** | `ProjectIntelligenceView` → `GET /api/v1/projects/:id/intelligence` |
| Copilot stream SSE | **YES** | `ProjectCopilotChatView` → `POST .../copilot/chat/stream` via `Shared.CopilotSSEParser` |
| Project AI jobs | **YES** | `ProjectAIView` → `GET /api/v1/projects/:id/ai` |
| Entry points | **YES** | `ProjectDetailView` quick links; intelligence → copilot navigation |

**Shared:** `ios/Shared/Sources/Shared/CopilotSSEClient.swift`, `APIClient.postForStream`.

---

## Smoke / CI

- API chain: `scripts/smoke/ios_mobile_api_chain.sh` (manager client + `GET …/intelligence`)
- Live LLM (web): `scripts/smoke/ai_live_provider.sh --require-live`
- iOS UI smoke: login + tabs (`ios/scripts/run-ios-uitest-smoke-local.sh`)
- Layer B E2E (optional local): `testManager_livePilot_projectIntelligenceAndCopilot` in `ios/scripts/run-ios-e2e-integration-local.sh` (`pilot_manager_intelligence`, `pilot_manager_copilot`; optional `IOS_E2E_PROJECT_ID`)

---

## Audit cross-links

- `docs/ai/AUDIT_AI_MODULE_FINAL_VERDICT.md`
- `ios/README.md`
