# Slice 02 — Evidence and acceptance

## Initial evidence (pre-change, reproducible on base `7c6ff21f`)

### PD-P1-04
- **Definition:** Dual navigation on project detail (`ProjectSubnav` + ops `Tabs`).
- **Severity:** P1
- **Route:** `/dashboard/projects/[id]`
- **Components:** `DashboardProjectDetailClient`, `ProjectSubnav`, `Tabs`
- **Behavior:** Five pilot links with `aria-current` above an 11-item `tablist` with `aria-selected`; overlapping destinations; bottom tabs did not update URL.
- **Desktop/mobile:** Both bars always rendered; mobile wraps/overflow risk.
- **A11y:** Mixed link-nav + tab semantics.
- **i18n:** Labels from `dashboardDetail` (EN/RU/ES/IT).
- **Security:** No RBAC issue; contractor Costs/Estimate remain same access.

### PD-P2-07
- **Definition:** No persistent non-LIVE readiness chip on `/dashboard/ai`.
- **Severity:** P2
- **Route:** `/dashboard/ai`
- **Components:** `DashboardAIClient`
- **Behavior:** Conditional not-configured Card only when rows exist; optimistic `visionConfigured=true`; no `configured_unverified`/`degraded` page chip.
- **False LIVE:** No literal LIVE string; honesty gap is missing persistent non-LIVE status.
- **Security:** UI-only; no paid AI calls added.

### PD-P2-04
- **Definition:** Returning managers see stacked onboarding above ops.
- **Severity:** P2
- **Route:** `/dashboard` (+ shell `LaunchConfidenceBanner`)
- **Persistence key:** `aistroyka:first-launch-guide:v1` (unchanged)
- **Behavior:** `FirstValueBanner`/`GetStartedPanel` above `DashboardOpsOverviewClient`; full launch banner for any incomplete activation.
- **Modal a11y:** Slice 01 `Modal` behavior must not regress.

## Dima review blocker (after Draft PR #221 head `39dc44d0`)

```text
BLOCKING_FINDING=PD-P1-04_KEYBOARD_TAB_NAVIGATION
```

Shared `Tabs`/`Tab` used `tabIndex={0}` only on the selected tab and `tabIndex={-1}` on others, but did not handle `ArrowLeft` / `ArrowRight` / `Home` / `End`. Keyboard users could focus only the active tab and could not reach other destinations in the tablist.

Therefore these claims were **not** confirmed at `39dc44d0`:

```text
ACTIVE_DESTINATION_ACCESSIBLE=true
ALL_EXISTING_DESTINATIONS_REACHABLE=true
```

Source-scanning `project-primary-nav.regression.test.ts` did not reproduce keyboard interaction.

## Keyboard remediation

- `Tabs` tablist: `aria-orientation="horizontal"` + `onKeyDown` with automatic activation via existing `onSelect` (`focus` + `click`).
- `ArrowRight` / `ArrowLeft` cycle; `Home` / `End` jump; handled keys `preventDefault`; unrelated keys ignored.
- Direct-child tab scoping avoids neighboring/nested tablists.
- Project-detail URL sync continues through the same controlled `onSelect` → `router.replace` path.
- Interaction coverage: `Tabs.keyboard.behavior.test.ts`, `tabs-keyboard.test.ts`, rewritten `project-primary-nav.regression.test.ts`.

## Acceptance results (post-remediation)

| Criterion | Result |
|-----------|--------|
| ONE_PRIMARY_PROJECT_NAVIGATION | true — single `project-primary-nav` tablist |
| DUPLICATE_NAVIGATION_REMOVED | true — `ProjectSubnav` unmounted |
| KEYBOARD_TAB_NAVIGATION | true — Arrow/Home/End interaction tests green |
| ACTIVE_DESTINATION_ACCESSIBLE | true — keyboard + click activate selected tab/`aria-selected` |
| ALL_EXISTING_DESTINATIONS_REACHABLE | true — all 11 destinations reached via ArrowRight cycle + click |
| RBAC_AND_ROUTE_GUARDS_UNCHANGED | true |
| STATUS_CHIP_PERSISTENT | true — chip in filterBar for all states |
| FALSE_LIVE_STATE_ABSENT | true — resolver never returns live |
| STATUS_COPY_LOCALIZED | true — EN/RU/ES/IT |
| EXISTING_AI_BEHAVIOR_UNCHANGED | true — no backend/billing change |
| FIRST_RUN_GUIDANCE_REMAINS_AVAILABLE | true — 0/5 expanded banner + GetStarted below ops |
| RETURNING_USER_OPERATIONS_FIRST | true — ops overview above GetStarted; compact banner |
| PERSISTENCE_KEY_UNCHANGED | true |
| MODAL_A11Y_REGRESSION | false — Modal.behavior tests green |
| NO_NEW_BLOCKING_ONBOARDING | true |

## Visual evidence

```text
VISUAL_EVIDENCE_BLOCKED=authenticated cabinet screenshots require a live synthetic session
```

## Baseline-versus-branch

`lib/ops/deploy-workflow.contract.test.ts`: 5 failed / 17 passed on **both** clean base `7c6ff21f` and this branch. Unrelated to Slice 02 file set. Not fixed (out of allowlist).
