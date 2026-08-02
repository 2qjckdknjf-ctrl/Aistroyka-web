# Phase 7 — AI Reliability Closure

Date: 2026-07-30  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch (dirty worktree): `security/platform-admin-separation`  
Phase 6 predecessor: YES — DEFERRED  

## Verdict

**Phase 7 YES — DEGRADED**

Selected runtime mode for the Phase 7 source under test: **paid-provider path fail-closed / deterministic degraded** until operator applies rate-limit RPC migration.  
Deployed staging/production (older runtime than this dirty tree) separately proved **product-route LIVE** on 2026-07-30; that proof does **not** transfer to the local Phase 7 source.

`Safe to proceed to Phase 8` = **YES**

## Environment classification (do not conflate)

| Target | Health (sanitized) | Product AI (`--require-live`) | Notes |
| --- | --- | --- | --- |
| Loopback current source (`http://127.0.0.1:3010`) | `openaiConfigured=true` after key inject; `aiConfigured=false`; `aiOperationalStatus=configured_unverified` | **NO-GO** exit 1 (`http_status=503` → rate-limit path; credentials probe succeeded separately) | Dirty source + fail-closed gates; RPC missing |
| Staging `https://staging.aistroyka.ai` | `aiConfigured=true`, `openaiConfigured=true`, `buildStamp.sha7=a401693` | **GO** exit 0 `product_route_live` | Deployed runtime ≠ dirty source |
| Production `https://aistroyka.ai` | `aiConfigured=false`, `openaiConfigured=true`, `buildStamp` absent | **GO** exit 0 `product_route_live` | Deployed runtime ≠ dirty source |

Supabase ref matched: `vthfrxehrursfloevnlp` (JWT service-role shape PRESENT).

## Why DEGRADED (not LIVE for Phase 7 source)

1. Live Supabase lacks `public.rate_limit_try_increment_multi` (migration `apps/web/supabase/migrations/20260725190000_rate_limit_try_increment.sql` — **not applied**; phase forbids migration apply).
2. Phase 7 makes paid AI routes use **fail-closed** `checkRateLimitStrict` + trusted CF IP only (no `x-forwarded-for` trust).
3. Therefore local/source paid provider invocation is blocked; vision may return deterministic fallback with `X-AI-Fallback-Reason: rate_limit_unavailable` (no provider call).
4. Direct OpenAI credentials probe succeeded and is classified **`credentials_provider_probe` only** — never satisfies `--require-live`.

## Security / reliability fixes shipped in this phase

- Canonical gate `scripts/smoke/ai_live_provider.sh`: explicit `BASE_URL` + controlled `IMAGE_URL`; no Unsplash default; no redirect-following with Authorization; `--require-live` requires product route live only; exit 2 prereq / exit 1 live fail.
- `/api/v1/ai/analyze-image` and `/api/v1/ai/analyze-video-daily`: auth before provider config disclosure; anonymous paid path closed; lite denied; SSRF URL assert; fail-closed rate limit.
- Shared `safe-remote-media` for Anthropic/Gemini/video binary fetch (scheme/host/IP/DNS/redirect/MIME/size/timeout).
- Copilot AI gate: trusted IP + fail-closed rate limit.
- Health contract: `visionProvidersConfigured`, `aiOperationalStatus`, `aiLastVerifiedSuccessAt` (never `live` from env alone).
- Public/dashboard claims: beta / simulation labeling; release notes Phase 7 note.

## Live provider call budget

Maximum allowed: 6. Used: **3**

1. Direct OpenAI credentials probe (local key) — not product live  
2. Staging authenticated `analyze-image` product route — LIVE  
3. Production authenticated `analyze-image` product route — LIVE  

No live audio/video probes. No circuit breaker reset. No tenant/grant creation (used existing smoke membership).

## Cleanup

Marker `PHASE7 TEMP p789466`:

- Temp project + project_members removed  
- Storage object `media/phase7/p789466/synth.png` removed (0 left)  
- Smoke `tenant_members` count unchanged (1)  
- No temp auth user / grants created  
- Local :3010 server stopped  
- Fixture token redacted on disk  

## Operator follow-ups (external)

1. Apply `20260725190000_rate_limit_try_increment.sql` to project `vthfrxehrursfloevnlp` before expecting paid AI on Phase 7 source in any environment.  
2. Re-run `BASE_URL=<target> IMAGE_URL=<controlled> bash scripts/smoke/ai_live_provider.sh --require-live` per environment after migrate + deploy.  
3. Add production `buildStamp` (Phase 8).  
4. Do not treat historical `AI_LIVE_PROVIDER_VALIDATION_REPORT.md` LEVEL 4 claims as current without fresh gate.

## Artifacts

- `docs/roadmap/AISTROYKA_PHASE7_AI_RUNTIME_MATRIX.csv`  
- `docs/roadmap/AISTROYKA_PHASE7_AI_CLAIMS_MATRIX.csv`  
- This closure  

## Gates (fresh this phase)

| Check | Result |
| --- | --- |
| Focused AI suites | 68 passed (11 files) |
| Full unit suite | 2716 passed (421 files) |
| `ai_live_provider.sh --require-live` | local exit 1; staging exit 0; production exit 0 |
| Phase 7 harness missing prereq | exit 2 |
| `check:design` | PASS |
| `i18n:check` | PASS |
| `lint` | PASS |
| `build` | PASS |
| `cf:build` | PASS |
| `validate-npm-lock` | PASS |
| `npm audit --omit=dev` | 0 vulnerabilities (root + contracts) |
| `git diff --check` | PASS |

## Confirmation

No commit, push, PR, deploy, migration apply, production env mutation, unauthorized tenant/grant creation, or secret disclosure in this phase.
