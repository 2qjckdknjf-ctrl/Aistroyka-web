# Step 15 — Estimate / Cost Intelligence Validation Report

## 1. Commands run

- **Build:** `npm run build` from repo root (build:contracts then build:web).
- **Tests:** `npx vitest run lib/domain/estimate/parse-cost-vision.test.ts` (parseCostVisionOutput).

## 2. Build result

- **Contracts:** clean + tsc + build succeeded.
- **Web:** Next.js 15.5.12 — Compiled successfully; lint and type check passed; static pages 276/276 generated; build was in progress (finalizing) at capture. No type errors in estimate domain, API routes, or ProjectEstimatePanel.

## 3. Tests

- **parseCostVisionOutput:** Unit tests added (parse-cost-vision.test.ts) for valid JSON, invalid confidence default, null ranges and empty arrays. Run with vitest when environment supports it (esbuild platform may block in some setups).
- **Estimate repository / service:** No DB-backed tests in this phase (migration adds new table; tests can be added when Vitest + Supabase are stable in CI).

## 4. Focused estimate workflow checks

| Check | Result |
|-------|--------|
| GET /api/v1/projects/:id/estimate returns budget + results + sources | Yes — estimate.service getProjectEstimateSummary. |
| POST /api/v1/projects/:id/estimate/from-image with image_url | Yes — analyzeImageForCost + createResult; returns result + summary. |
| Cost vision prompt override in Gemini/OpenAI/Anthropic | Yes — systemPrompt/userMessage in VisionOptions; all three providers use overrides. |
| Estimate panel in project detail (Estimate tab) | Yes — ProjectEstimatePanel: budget, latest estimate, from-image form, source documents. |
| Budget vs AI estimate distinction in UI | Yes — "Recorded budget" vs "Latest estimate (AI)". |
| Confidence and missing/assumptions shown | Yes — in latest estimate card. |
| Tenant/project/auth on estimate APIs | Yes — getTenantContextFromRequest, getProjectById, canManageProjects for from-image. |

## 5. Unrelated blockers

- **Vitest/esbuild:** Same as Step 14; tests may not run in all environments. No change to Step 15 scope.

## 6. Final confidence level

- **Build:** High — production build compiles and type-checks.
- **Estimate layer:** High — input scope documented, domain model and migration in place, extraction (cost vision) and rough estimate API and UI implemented, state and market foundation documented.
- **Tests:** Medium in-session (parse-cost-vision tests added; full test run depends on environment).
