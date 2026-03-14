# Design Release Precheck

## Stage A — Pre-Release Inventory

### 2.1 Repository State

- **Current branch:** ops/external-setup-attempt
- **Remote:** origin git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git
- **Staged (pre-existing):** 7 files (deploy-related: page.tsx, vercel.json, docs) — will unstage for design-only release

### 2.2 Tooling

- **Package manager:** npm (package-lock.json), bun referenced in root package.json
- **Monorepo:** apps/web, packages/contracts, packages/contracts-openapi
- **Web app root:** apps/web
- **vercel.json:** Present in apps/web; installCommand and buildCommand from repo root
- **Build:** `npm run build` (contracts + web), `npm run lint`, `npm run test`

### 2.3 Release-Scope Files

| Category | Files |
|----------|-------|
| Design system | apps/web/lib/design/*.ts |
| Design tokens | apps/web/app/design-tokens.css, globals.css |
| Layout/typography | apps/web/app/layout.tsx, tailwind.config.ts |
| Public site | apps/web/app/[locale]/(public)/layout.tsx, PublicHomeContent.tsx |
| Components | PublicHeader.tsx, PublicFooter.tsx, Logo.tsx |
| UI | components/ui/AIInsightCard, Icon, Panel, StatCard, index.ts |
| Brand assets | public/brand/aistroyka-logo.png, aistroyka-icon.png, README.md |
| Favicon | public/favicon.ico, favicon-32x32.png |
| Dependencies | apps/web/package.json, package-lock.json (framer-motion, lucide-react) |
| Docs | docs/DESIGN_SYSTEM.md, WEBSITE_REDESIGN_REPORT.md, BRAND_ASSETS.md, LOGO_INTEGRATION_REPORT.md, MOBILE_DESIGN_SYSTEM.md |
| iOS logo | ios/*/Info.plist, ManagerLoginView, LoginView, HomeDashboardView, AppLogo.imageset |
| Android logo | android/*/res/drawable/aistroyka_logo.png, ManagerApp.kt, WorkerApp.kt |

### 2.4 Unrelated Files (Excluded)

- .github/workflows/*
- android/.gradle, android/*/build, gradle wrapper
- API routes, lib/ai-brain, lib/copilot, lib/observability, etc.
- packages/contracts (except if no changes)
- docs/ENVIRONMENT-VARIABLES, FUNCTIONALITY_STATUS_REPORT, etc.
- Staged deploy docs (REPORT-PRODUCTION-ROOT-REDIRECT-FINAL, etc.)
- vercel.json (unless required for asset paths — current config is fine)

### 2.5 Initial Risks

1. Branch ops/external-setup-attempt may not be production deploy branch
2. favicon.ico may be PNG-with-ico-extension (noted in LOGO_INTEGRATION_REPORT)
3. Many unrelated unstaged changes — must stage only design scope
