# AISTROYKA QA Platform

Permanent quality assurance system for continuous validation across web, dashboard, API, AI, security, and release readiness.

## Quick start

```bash
# 1. Copy env template
cp .env.qa.example .env.qa

# 2. Self-audit (no server required)
bun run qa:self-audit

# 3. Public/unauth tests against staging
PLAYWRIGHT_BASE_URL=https://staging.aistroyka.ai PLAYWRIGHT_SKIP_WEB_SERVER=1 bun run qa:public

# 4. Full platform (local dev or staging)
bun run qa:platform

# 5. Release gate (unit + lint + tsc + release:check + Playwright)
bun run qa:release
```

## Structure

| Path | Purpose |
|------|---------|
| `docs/qa/QA_SYSTEM_INVENTORY.md` | Phase 1 discovery baseline |
| `apps/web/tests/qa/` | Playwright suites (phases 3–16) |
| `apps/web/playwright.qa.config.ts` | Multi-browser/device config |
| `scripts/qa/` | Orchestration, self-audit, reports |
| `.github/workflows/qa-platform.yml` | CI: PR public, nightly, manual |
| `docs/qa/reports/` | Generated verdicts and coverage |

## Test phases

| Spec | Phase |
|------|-------|
| `01-public-website.spec.ts` | Website, SEO, navigation, 404 |
| `02-auth.spec.ts` | Login, session, protected routes |
| `03-roles.spec.ts` | RBAC, lite client, stakeholder finance |
| `04-business-logic.spec.ts` | Projects, tasks, reports |
| `05-backend-network.spec.ts` | API error monitor, contracts |
| `06-database-consistency.spec.ts` | CRUD/pagination consistency |
| `07-ai-validation.spec.ts` | AI auth, leakage, disabled states |
| `08-design-responsive.spec.ts` | Layout, screenshots, multi-device |
| `09-performance.spec.ts` | Load budgets, API latency |
| `10-accessibility.spec.ts` | Headings, labels, keyboard |
| `11-security.spec.ts` | Sensitive endpoints, XSS, headers |

## CI behavior

- **PR:** self-audit + public/unauth Playwright (no secrets required)
- **Nightly:** full suite when `PILOT_E2E_*` secrets present
- **Manual:** `workflow_dispatch` with `target_url` + `mode`

## Evidence policy

Tests **skip** (not pass) when credentials or functionality are missing.  
Verdicts use **YES / NO / UNKNOWN** — never fake PASS without evidence.
