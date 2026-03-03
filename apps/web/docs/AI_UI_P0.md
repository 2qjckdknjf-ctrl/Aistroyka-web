# AI UI P0 — Copilot panel, error mapping, request_id, low-confidence

**Scope:** Web-only. Engine/Edge unchanged.

---

## Where the panel is

- **Project overview:** `/[locale]/projects/[id]` — section "AI Copilot" at the top (above Executive Overview).
- **Dedicated AI page:** `/[locale]/projects/[id]/ai` — full-page AI Copilot with back link to project.

Both use the same component: `components/ai/AiActionPanel.tsx`, with `decisionContext` built from project/analysis data via `lib/engine/buildContext.ts`.

---

## Request ID (authoritative)

- **Precedence:** Backend is source of truth. Order: **response header `X-Request-Id`** > **body `request_id`** > **client-generated** (sent as `X-Request-Id`).
- The client always generates a `requestId` before the request and sends it as `X-Request-Id`. After the response, the authoritative ID is taken from the header (if present), else from the body, else the sent value. This ID is returned from all engine calls and stored in `EngineError.requestId` on failure.
- In **dev/staging** (`NODE_ENV !== "production"` or `NEXT_PUBLIC_ENV === "staging"` or `NEXT_PUBLIC_VERCEL_ENV === "staging"`), the panel shows a copyable request ID next to Run; the **Diagnostics** block also shows it.
- **Copy button:** Shows "Copied" for 1.5s after copy.

---

## Modes (tabs)

1. **Summary** — Executive summary (no question). Calls `runExecutiveSummary(ctx)`.
2. **Explain Risk** — Optional question. Calls `runExplainRisk(ctx, question)`.
3. **Copilot** — Required question. Calls `askCopilot(ctx, question)`. Submit: **Ctrl+Enter**. Enter alone inserts newline.

Run button sends the request to the Copilot Edge function (`aistroyka-llm-copilot`). Auth: Supabase session token via `getAuthToken`.

---

## Error mapping and banners

All errors from the engine client are normalized to `EngineError` in `lib/engine/errors.ts`. The UI uses **AiErrorBanner** (not AiStatusBanner) with consistent footer: **request_id + Copy** and role="alert".

### Error kinds and UX

- **rate_limited** (429) — Retryable. Message + **countdown** from `Retry-After` header (seconds or HTTP-date); Retry button enabled only after countdown reaches zero. Default 60s if header missing.
- **circuit_open** — Retryable. Message: "It will auto-recover in about 60 seconds." No countdown.
- **timeout** — Retryable. Message + Retry.
- **budget_exceeded** — Not retryable. Message + "Contact your administrator or wait for the next period." Optional CTA/text for usage when available.
- **security_blocked** — Not retryable. "Please rephrase your request."
- **unauthorized** (401/403) — Not retryable. "Please sign in again."
- **unknown** — Generic message; request_id shown in banner footer. Retry if 5xx/408.

`retryAfterSeconds` is set from the **Retry-After** response header (parsed as integer seconds or HTTP-date). Countdown updates every 1s.

---

## Low-confidence UX

When the response has `groundedness_passed === false` or `retrieval_low_confidence === true`:

- **LowConfidenceNotice** — Expandable "Why this happened?" with text: "AI had limited project context for this answer. Consider clarifying your question or adding more data to the project."
- In **Copilot** tab: button **"Suggest a follow-up question"** — inserts a template into the question textarea (no API call).

---

## Diagnostics (dev/staging only)

When `NODE_ENV !== "production"` or `NEXT_PUBLIC_ENV === "staging"` or `NEXT_PUBLIC_VERCEL_ENV === "staging"`, a **Diagnostics** `<details>` block is shown with:

- `request_id`
- `mode` (summary / explain_risk / copilot)
- `retrieval_low_confidence`, `fallback_reason`, `error_category` (from last result or error)

Hidden in production.

---

## Global error boundary

- **app/error.tsx** uses shared **ErrorState** UI and a "Go home" link.
- In **dev**, if the URL has `?request_id=...`, that value is shown in the error message for support.

---

## A11y and UX

- Tabs: `role="tablist"`, `role="tab"`, `aria-label`, `aria-selected`, focus ring.
- Copilot textarea: `aria-label`, focus ring; Ctrl+Enter to submit, Enter for newline.
- Banners: `role="alert"`. Copy button: focus ring, `aria-label` ("Copy request ID" / "Copied").
- Disabled states on Run when loading.

---

## How to test

1. **Manual:** Open a project (with at least one analysis for better context), go to project page or `/[locale]/projects/[id]/ai`. Run Summary / Explain Risk / Copilot; check success, error banner (e.g. 429 with countdown), low-confidence explainer, request_id (in dev), Diagnostics (dev/staging).
2. **E2E:** `npx playwright test` (see `tests/e2e/ai-smoke.spec.ts`). Optional: mock 429 + Retry-After and assert banner and request_id visibility/copy.
3. **Unit:** `lib/engine/client.test.ts` — request_id precedence (header > body > generated). Run: `npm run test` or `npx vitest run lib/engine/client.test.ts`.

---

## Files

- `lib/engine/client.ts` — fetch, X-Request-Id, authoritative request_id, timeout 8s, abort. Exports `getAuthoritativeRequestId`, `generateRequestId` for tests.
- `lib/engine/errors.ts` — `EngineError` (with `retryAfterSeconds`), `mapToEngineError`, `parseRetryAfterHeader`.
- `lib/engine/types.ts` — Copilot types, `CopilotResponsePayload`.
- `lib/engine/ai.ts` — `runExecutiveSummary`, `runExplainRisk`, `askCopilot`; passes response headers into `mapToEngineError`.
- `lib/engine/buildContext.ts` — `buildDecisionContextFromProject`.
- `components/ai/AiActionPanel.tsx` — Tabs, Run, result/error, LowConfidenceNotice, request_id, Diagnostics (dev/staging), Loading/empty states.
- `components/ai/AiErrorBanner.tsx` — Error message by kind, countdown for rate_limited, Retry when allowed, request_id footer + Copy.
- `components/ai/LowConfidenceNotice.tsx` — Expandable "Why this happened?", "Suggest a follow-up question" (Copilot).
- `components/ai/LowConfidenceBadge.tsx` — "Limited context" badge (used inside LowConfidenceNotice).
- `components/ai/CopyRequestIdButton.tsx` — Copy request_id; "Copied" for 1.5s, focus ring, aria-label.
- `app/error.tsx` — Global error boundary; ErrorState; dev: request_id from URL.
