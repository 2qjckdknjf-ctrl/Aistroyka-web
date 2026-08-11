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

```text
FULL_SUITE_BRANCH=1762_PASS_5_BASELINE_FAIL
BASELINE_FAILURE_REGRESSION=false
```

## Cloudflare Workers Build investigation (PR #221)

### Exact identities

| Field | Value |
|-------|--------|
| Service | `aistroyka-web-production` |
| Branch | `design/product-design-remediation-slice-02-2026-08-11` |
| Exact head | `5dc848a0dd96923d74955ae0ca51bf65648805e8` |
| Initial failed build | `ea8e28de-c895-4204-9cd1-70bb24e0e585` |
| Initial failed check | GitHub check-run `93853636972` (duration reported `0s`) |
| Prior SUCCESS on previous head `39dc44d0` | build `d36ed0fa-1541-47b7-a8f1-7ffa2fc1cf1c` → Version `192591ab-…` + Preview/Alias URLs |
| Safe preview rerun (once) | GitHub Check Re-run on same exact head |
| Rerun build | `f79cd88d-24d3-4f15-ab4a-161a0be0121a` |
| Rerun check | `93863856946` **SUCCESS** |
| Rerun Version ID | `9eed5e1e-f73e-4882-a4c1-9bde64688d1f` (#1391) |
| Preview URL | `https://9eed5e1e-aistroyka-web-production.z6pxn548dk.workers.dev` |
| Preview Alias URL | `https://design-product-design-remediation-0fe1-aistroyka-web-production.z6pxn548dk.workers.dev` |
| Trigger annotation | `workers/triggered_by=version_upload` (preview version upload, not production traffic switch) |

### Evidence sources attempted

1. GitHub checks API / check-run output / annotations (no log text; failure summary had Build ID + Script only)
2. Commit statuses (Vercel SUCCESS; Workers Builds is Check Run)
3. Cloudflare Workers Builds REST (`/accounts/.../builds/workers/...`) → **403 Authentication error** with configured API token
4. Cloudflare Workers versions/deployments APIs → **OK** (read-only)
5. `wrangler deployments list` / `versions list` → **OK**
6. Cloudflare Builds MCP → server discovery/auth error / timeout
7. Authenticated browser session → account Workers deep-links often **404/permission**; GitHub Check Re-run UI accessible
8. GitHub Actions artifacts → N/A for external Cloudflare check
9. CF docs: non-production branch builds default to `wrangler versions upload` (preview)

### Production traffic safety

```text
PRODUCTION_TRAFFIC_SHA=7c6ff21
ACTIVE_DEPLOYMENT_VERSION=2752113e-0feb-4d10-86ef-82b792483968 @ 100%
FEATURE_PREVIEW_IN_PRODUCTION_TRAFFIC=false
PRODUCTION_INCIDENT=false
```

Live health `buildStamp.sha7` remained `7c6ff21` before and after the preview rerun. Preview version `9eed5e1e-…` is not in the active deployment percentages.

### Classification

```text
CLOUDFLARE_FAILURE=TRANSIENT_OR_STALE
FAILURE_CLASSIFICATION=TRANSIENT_EXTERNAL_FAILURE
CLOUDFLARE_GATE=PASS
CLOUDFLARE_EXACT_HEAD_PASS=true
SOURCE_CAUSAL_LINK=false
```

Initial failure produced no Version ID / Preview URLs and completed in `0s`. One authorized feature-branch GitHub Re-run on the same SHA succeeded and uploaded a preview version only. No Slice 02 source fix was required.
