# AISTROYKA — Canonical Final Redesign

**Decision state:** FINAL APPROVED CONCEPT  
**Date:** 2026-08-16  
**Branch:** `design/aistroyka-canonical-render-pack-2026-08-16`

This document is the implementation-oriented source of truth for the approved AISTROYKA redesign.

## 1. Product intent

AISTROYKA is an AI-powered construction management platform for contractors, managers, workers, owners/clients and project stakeholders. The redesign must improve the existing product rather than replace its identity or workflows.

Primary product outcomes:

- faster decisions;
- clearer project health;
- fewer missed risks and overdue actions;
- rapid field reporting and review;
- transparent schedule, budget, documents and decisions;
- role-appropriate experiences across manager, worker and owner surfaces.

## 2. Canonical information architecture

### A. Dashboard

Purpose: portfolio command view.

Priority order:

1. what requires attention now;
2. portfolio/project health;
3. reports awaiting review;
4. overdue/critical tasks;
5. AI briefing;
6. recent operational activity.

### B. Projects

Purpose: find, compare and enter projects quickly.

Must include:

- search and compact filters;
- project health/risk state;
- progress;
- schedule/budget signal;
- responsible team;
- quick create/open actions.

### C. Project Command Center

Purpose: one central workspace for an individual project.

Primary project navigation:

- Overview
- Tasks
- Reports
- Documents
- Schedule
- Budget / Costs
- Risks
- Team
- Decisions / Approvals

Do not create competing primary tab systems.

Above-the-fold priority:

- project identity/status;
- progress;
- schedule health;
- budget health;
- today's focus / attention;
- AI risk/recommendation state.

### D. Tasks

Purpose: operational execution and prioritisation.

Desktop: board/list switch with a detail pane.  
Tablet: compact board/list with contextual inspector.  
Phone: prioritized list, fast status changes, assignee/context and large touch actions.

### E. Reports & Review

Purpose: field evidence → AI analysis → manager decision.

Core flow:

1. project/task context;
2. before/after evidence;
3. weather/conditions where relevant;
4. text/voice/files;
5. AI observations;
6. decision: Approve / Request changes / Reject;
7. comments and audit history.

### F. Documents & Drawings

Purpose: one project source of truth for files, drawings, versions and approvals.

Must support:

- structured folders/categories;
- current version + history;
- status/approval state;
- preview/inspector;
- annotations/review concept;
- fast upload and search.

### G. Schedule & Milestones

Purpose: timeline, dependencies and early warning.

Desktop prioritizes timeline/Gantt and risk relationships. Tablet offers calendar/timeline. Phone exposes milestone health, lookahead and actionable delays rather than a compressed desktop Gantt.

### H. Team & Contractors

Purpose: people, responsibilities, availability, activity and contractor relationships.

Prioritize role clarity, current assignment, presence/status and quick communication/context.

### I. AI Risks & Analytics

Purpose: explainable intelligence, not decorative AI.

AI must surface:

- risk;
- evidence/signals;
- estimated impact;
- confidence where useful;
- recommended next action;
- link to the underlying project/task/report/document.

### J. Owner / Client Portal

Purpose: confidence and decision support for the customer.

Show:

- progress;
- next milestone;
- budget/status summary;
- recent photos;
- approved/pending changes;
- decisions awaiting owner;
- project health.

Hide contractor/admin tools and internal operational noise.

## 3. Responsive behavior

### Desktop

High-information management workspace with persistent navigation, contextual side panels and multi-column dashboards. Density is allowed only when hierarchy remains obvious.

### Tablet

Two-column adaptive management/field experience. Navigation compresses. Inspectors may become drawers. Touch targets remain comfortable.

### Phone

Field-first, one primary action per view, progressive disclosure, bottom navigation / contextual actions, large touch targets and fast evidence capture/review.

Responsive design means reprioritizing information, not simply shrinking desktop layouts.

## 4. Canonical visual system

### Foundation

- near-black / deep graphite / deep navy surfaces;
- subtle depth and atmospheric gradients;
- high contrast text hierarchy;
- construction yellow remains unmistakably AISTROYKA.

### Liquid Glass

Glass should behave as a material, not a transparent rectangle:

- refraction layer;
- tint layer;
- edge sheen;
- controlled backdrop blur;
- translucent border;
- internal highlight;
- elevation through light and shadow;
- intensity variants for chrome, panel, card and control.

Avoid excessive blur that destroys readability.

### Color roles

- **Yellow:** brand, primary action, focus, selected state, key progress highlight.
- **Cyan / blue:** live data, information, system intelligence.
- **Violet:** AI reasoning/advanced intelligence/contextual assistant.
- **Green:** healthy/on track/approved/completed.
- **Orange:** watch/pending/attention.
- **Red:** critical/blocked/rejected/overdue.

Spectral color should create depth and intelligence, not neon visual noise.

## 5. Living components

### Buttons

Primary controls should support:

- subtle edge refraction;
- hover lift on pointer devices;
- tactile press scale;
- moving sheen or localized highlight where appropriate;
- loading/progress morph;
- success/error confirmation states.

### Cards and widgets

Widgets may react to fresh data through:

- count-up / value transition;
- progress interpolation;
- small chart draw;
- status crossfade;
- controlled pulse for genuinely live/critical state.

Do not animate static dashboards continuously.

### AI assistant

AI is a contextual layer across the product, not a disconnected decorative orb. It should appear where it can explain, recommend or accelerate an action.

## 6. Motion system

Motion must communicate hierarchy, causality and state.

Recommended classes of motion:

- 150–200 ms tactile controls;
- 220–300 ms panel/card transitions;
- 300–450 ms modal/drawer/context transitions;
- slow ambient spectral drift only in decorative background/AI moments;
- spring-like but restrained response for interactive glass controls;
- stagger only for meaningful content entry.

Requirements:

- `prefers-reduced-motion` support;
- no motion that blocks interaction;
- no perpetual animation on every card;
- no important state conveyed through animation alone.

## 7. Design quality rules

The implementation is incorrect if it:

- looks like a generic admin template;
- turns AISTROYKA into e-commerce, marketplace or estimator-only software;
- uses neon everywhere without hierarchy;
- uses glass at the expense of legibility;
- duplicates navigation systems;
- gives the owner contractor/admin controls;
- shrinks desktop UI directly onto mobile;
- treats AI as decoration without evidence/actions;
- changes business logic/RBAC merely to fit the new UI.

## 8. Canonical render inventory

The final approved render family represents these ten surfaces across desktop/tablet/phone:

1. Dashboard
2. Projects
3. Project Command Center
4. Tasks
5. Reports & Review
6. Documents & Drawings
7. Schedule & Milestones
8. Team & Contractors
9. AI Risks & Analytics
10. Owner / Client Portal

Earlier experimental renders are inspiration/history only and must not override this final direction.

## 9. Implementation constraints

When Cursor or another agent implements the redesign:

1. inspect the current code and flows first;
2. reuse and extend existing AISTROYKA design tokens and Liquid Glass primitives where technically sound;
3. preserve routing, RBAC, tenant isolation, APIs, migrations and production behavior unless a separately approved task changes them;
4. implement by vertical slices with visual regression and accessibility checks;
5. keep desktop, tablet and phone behavior intentional at every slice;
6. validate keyboard navigation, focus visibility, contrast and reduced motion;
7. never merge automatically without the user's normal merge authorization workflow.

## 10. Final decision

**This document and the final render family are the canonical design baseline for the next AISTROYKA design implementation phase.**
