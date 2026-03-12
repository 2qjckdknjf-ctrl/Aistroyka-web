# Product Activation Layer — Implementation Report

**Date:** 2026-03-12  
**Phase:** Product Activation Layer (Stages 31–37)

---

## 1. Goal

Enable new users to:
1. Register
2. Create first project
3. Add team
4. See AI analysis

With onboarding flow, demo project, Get Started checklist, team invites, AI demo mode, and first-value moment after first report.

---

## 2. Stage 31 — Onboarding Flow

**Status:** Done

- **Component:** `apps/web/components/onboarding/`
  - `OnboardingWizard.tsx` — 4 steps: company type, create first project, invite team, enable AI insights.
  - `OnboardingGate.tsx` — Wraps dashboard content; when user has no projects, shows onboarding wizard instead of dashboard.
- **API:** `GET /api/activation/status` returns `showOnboarding: true` when `projectCount === 0`.
- **Integration:** Dashboard page wraps main content in `<OnboardingGate>`; new users see the wizard until they create a project.
- **i18n:** `messages/en.json` — namespace `onboarding` (step, companyType, createProject, inviteTeam, enableAi, back, next, finish).

---

## 3. Stage 32 — Demo Project

**Status:** Done

- **Dataset:** `components/onboarding/DemoProjectCard.tsx` exports `DEMO_PROJECT` with sample tasks, reports, photos count, alerts, and AI insights (summary, risks, recommendations).
- **Display:** When user has no projects, `DashboardRecentProjectsClient` shows `DemoProjectCard` (demo project card with tasks, reports, AI summary) and a “Create your first project” button.
- **Location:** Shown in the “Recent projects” section when the project list is empty.

---

## 4. Stage 33 — Get Started Panel

**Status:** Done

- **Component:** `components/onboarding/GetStartedPanel.tsx`
- **Checklist:** Create project, Invite team, Add first task, Upload first report, View AI insights. Each item links to the right place; completed items show a checkmark.
- **Data:** Uses `GET /api/activation/status` → `getStarted` (createProject, inviteTeam, addTask, uploadReport, viewAi).
- **Visibility:** Rendered on dashboard above ops overview; hidden when all items are done and user has at least one project.

---

## 5. Stage 34 — Team Invites

**Status:** Done

- **Existing:** `POST /api/tenant/invite` — body `{ email, role? }`, creates `tenant_invitations`, returns accept link.
- **New:** `POST /api/invite` — re-exports the same handler from `@/app/api/tenant/invite/route` for a single invite API entry point. Contract: email (required), role (optional), project (optional for future use).
- **UI:** Team page (`/team`) already has invite form (email, role); no change. Invites are tenant-scoped; optional `project` in body is for future per-project invites.

---

## 6. Stage 35 — AI Demo Mode

**Status:** Done

- **Component:** `components/intelligence/CopilotSummaryPanel.tsx`
- **Behavior:** When Copilot has no data (error or no brief content), the panel shows “Sample insights (no data yet)” with:
  - Sample project summary
  - Sample top risks (list)
  - Sample recommendations (list)
- **Trigger:** `showDemoMode = !isPending && (isError || !brief)`.

---

## 7. Stage 36 — First Value Moment

**Status:** Done

- **Component:** `components/onboarding/FirstValueBanner.tsx`
- **Trigger:** Shown when `reportCount >= 1` and `projectCount >= 1` (from `/api/activation/status`).
- **Content:** “First report submitted. View AI analysis: Project health, Top risks, Recommendations” with link to first project’s AI tab (or dashboard projects if no id).
- **API:** `GET /api/activation/status` now returns `firstProjectId` (oldest project) for the link.
- **Note:** Triggering AI analysis on first report is backend/upload flow; the banner directs the user to view results. Existing analysis trigger (e.g. on upload/process) is unchanged.

---

## 8. Stage 37 — QA Checklist

**Checklist for manual/automated verification:**

| Item | How to verify |
|------|----------------|
| **Registration** | Sign up new user → redirect to dashboard or onboarding. |
| **Onboarding** | With no projects, dashboard shows onboarding wizard (4 steps). Complete or skip by creating a project. |
| **Dashboard** | With projects, dashboard shows header, Get Started panel (until complete), ops overview, recent projects, intelligence section. |
| **Demo project** | With no projects, “Recent projects” shows Demo project card (tasks, reports, AI summary) and “Create your first project”. |
| **Get Started** | Checklist: Create project, Invite team, Add first task, Upload first report, View AI insights. Each step links correctly; completion reflects activation status. |
| **Team invites** | `/team` — invite by email and role. `POST /api/invite` or `POST /api/tenant/invite` creates invitation and returns accept link. |
| **AI demo mode** | Open a project’s AI/Copilot tab with no analysis data → panel shows sample summary, risks, recommendations. |
| **First value** | After at least one report and one project, dashboard shows First value banner with link to AI insights. |

---

## 9. Files Created/Updated

**New files:**
- `apps/web/app/api/activation/status/route.ts` — activation state for onboarding and Get Started.
- `apps/web/app/api/invite/route.ts` — re-export of tenant invite POST.
- `apps/web/components/onboarding/OnboardingWizard.tsx`
- `apps/web/components/onboarding/OnboardingGate.tsx`
- `apps/web/components/onboarding/GetStartedPanel.tsx`
- `apps/web/components/onboarding/DemoProjectCard.tsx`
- `apps/web/components/onboarding/FirstValueBanner.tsx`
- `apps/web/components/onboarding/index.ts`

**Updated:**
- `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` — OnboardingGate, GetStartedPanel, FirstValueBanner.
- `apps/web/app/[locale]/(dashboard)/dashboard/DashboardRecentProjectsClient.tsx` — DemoProjectCard when no projects.
- `apps/web/components/intelligence/CopilotSummaryPanel.tsx` — AI demo mode when no data.
- `apps/web/messages/en.json` — `onboarding` namespace.

---

## 10. Summary

- **Onboarding:** 4-step wizard when user has no projects; gate on dashboard.
- **Demo project:** Shown in recent projects when list is empty (tasks, reports, photos, alerts, AI insights).
- **Get Started:** Checklist on dashboard (create project, invite team, add task, upload report, view AI).
- **Invites:** `POST /api/invite` (and existing `/api/tenant/invite`) with email and role.
- **AI demo mode:** Copilot shows sample summary, risks, and recommendations when there is no real data.
- **First value:** Banner after first report with link to AI insights.

All stages 31–37 are implemented. QA checklist is in Section 8.
