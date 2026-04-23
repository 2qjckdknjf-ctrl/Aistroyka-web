# Figma Source of Truth and Code Connect Plan

## Objective
Use one Figma library as the visual source of truth and connect it to real code components in Aistroyka.

## Library Structure (Single Figma File)

### Foundations
- Colors (brand, semantic, states)
- Typography scale
- Spacing/radius/shadow/motion tokens
- Iconography rules

### Core Components
- Button (primary/secondary, states)
- Input (default/focus/error/disabled)
- Card (default/raised/muted)
- Badge and Alert
- Table primitives
- Navigation primitives (public header + dashboard shell patterns)

### Patterns
- Auth forms
- Dashboard page skeleton
- Empty/Loading/Error states
- Mobile login/home/report flow primitives

## Required Mapping to Code

### Web Component Targets
- `/Users/alex/Projects/AISTROYKA/apps/web/components/ui`
- `/Users/alex/Projects/AISTROYKA/apps/web/components/public/PublicHeader.tsx`
- `/Users/alex/Projects/AISTROYKA/apps/web/components/DashboardShell.tsx`

### Mobile Component Targets
- iOS:
  - `/Users/alex/Projects/AISTROYKA/ios/AiStroykaManager/AiStroykaManager/Design`
  - `/Users/alex/Projects/AISTROYKA/ios/AiStroykaWorker/AiStroykaWorker/Views`
- Android:
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui`
  - `/Users/alex/Projects/AISTROYKA/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui`

## Operational Workflow in Cursor

1. Build/update design library using:
   - `/figma-generate-library`
2. Update screen-level designs from code baseline using:
   - `/figma-generate-design`
3. Create/refresh Code Connect mappings using:
   - `/figma-code-connect-components`
4. Validate designer and developer context using Figma tools:
   - `get_design_context`
   - `get_code_connect_map`
   - `get_code_connect_suggestions`

## Mapping Contract
- Every mapped Figma component must reference:
  - Code path
  - Export/symbol name
  - Variant/state contract
  - Token dependency notes
- Mappings are reviewed with FE + mobile owners before rollout wave merges.

## Change Management
- Token change order:
  1. Update canonical token model doc.
  2. Update Figma tokens/components.
  3. Update code token adapters (web/iOS/Android).
  4. Run visual and behavior smoke checks.
- No direct component-level visual changes without token-level traceability.

## Done Criteria (Figma + Code Connect)
- One active Figma library file for Aistroyka product surfaces.
- Core components mapped to web/mobile code with Code Connect.
- Teams can inspect component->code links without manual guesswork.
