# AI Flywheel Git Hygiene Audit

**Date:** 2026-06-17  
**Purpose:** Clean commit for final tail closure + CI cf:build proof

## Starting state

| Field | Value |
|-------|-------|
| Original branch | `feat/p1-footer-tokens` |
| Original HEAD | `406e1888341b8f165b11ae63a290bbdb3c4fc542` |
| Closure branch | `ai/flywheel-final-tail-closure` |

## Included (Category A — flywheel tail closure)

### Web code
- `apps/web/lib/platform/ai-flywheel/**`
- `apps/web/lib/features/ai/api/**`
- `apps/web/lib/features/ai/components/CopilotOptionalFeedback.tsx`
- `apps/web/lib/features/ai/components/CopilotChatPanel.tsx`
- `apps/web/lib/ai-brain/phase-d/feedback/**`
- `apps/web/app/api/v1/ai/feedback/**`
- `apps/web/app/api/v1/tenant/ai-training-consent/**`
- `apps/web/app/[locale]/(dashboard)/admin/ai/**`
- `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts`
- `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts`
- `apps/web/supabase/migrations/20260617120000_ai_flywheel_foundation.sql`
- `apps/web/messages/{en,ru,es,it}.json`
- `apps/web/vitest.config.ts`
- `apps/web/app/api/v1/ai/transcribe/route.test.ts`
- `scripts/ai/**`

### iOS code
- `ios/Shared/Sources/Shared/AiFeedbackSubmit.swift`
- `ios/Shared/Sources/Shared/AiFlywheelConfig.swift`
- `ios/AiStroykaManager/.../ProjectCopilotChatView.swift`
- `ios/AiStroykaManager/.../*.lproj/Localizable.strings` (copilot feedback strings)

### Docs
- `docs/ai-flywheel/**`

## Excluded (Category B)

| Path | Reason |
|------|--------|
| `AGENTS.md` | Memory-updater delta; not product closure |
| `.cursor/hooks/state/continual-learning-index.json` | Local index (not in git status) |
| `apps/web/app/api/v1/billing/webhook/route.ts` | Stripe/billing unrelated |
| `apps/web/lib/platform/billing/webhooks.handler.ts` | Stripe unrelated |
| `apps/web/.dev.vars.example`, `.env.local.example`, `.env.production.example` | Stripe price IDs unrelated |
| `apps/web/wrangler.toml`, `wrangler.deploy.toml` | Stripe vars unrelated |
| `apps/web/scripts/set-cf-secrets.sh` | Unrelated deploy script delta |
| `ios/Shared/.build/**` | Local SPM build artifacts |

## Commit plan

Single commit on `ai/flywheel-final-tail-closure`:

```
chore(ai-flywheel): close final feedback gating and validation tails
```

Then push and verify CI Check **Cloudflare bundle (no deploy)** on new SHA.
