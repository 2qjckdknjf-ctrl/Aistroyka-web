# Unified Design Governance and PR Checklist

## Purpose
Prevent visual drift after rollout by enforcing token usage, accessibility, localization readiness, and regression safety.

## Mandatory PR Checklist

### Design Token Compliance
- [ ] No new raw hex/rgb/hsl color literals in UI components.
- [ ] No new ad-hoc spacing/radius values when equivalent token exists.
- [ ] Component styles use canonical `aistroyka` semantic/component tokens.
- [ ] Legacy alias usage is reduced or unchanged (not expanded).

### Component Behavior and States
- [ ] Updated components include required states (default, focus, disabled, error, loading as applicable).
- [ ] Auth-critical controls keep behavior unchanged (only visual/token updates).
- [ ] Dashboard navigation and tenant-role behavior remain unchanged.

### Accessibility (A11y)
- [ ] Interactive controls have visible focus styles.
- [ ] Touch/click targets meet minimum size expectations.
- [ ] Color contrast remains readable on dark surfaces.
- [ ] Semantic labels/roles remain present for key interactions.

### Localization (i18n)
- [ ] No hardcoded user-facing copy in changed UI files.
- [ ] New strings are added through existing locale dictionaries where applicable.
- [ ] Layout remains resilient for longer localized text.

### Visual Regression Safety
- [ ] Screenshots or before/after evidence attached for changed surfaces.
- [ ] Critical flows smoke-tested after visual changes:
  - Web login/dashboard navigation
  - Mobile login/home/report flow
- [ ] No unexpected changes to route guards or middleware behavior.

## Lightweight Review Protocol

1. **Author self-check** using checklist above.
2. **Design-system owner review** for token adherence.
3. **Platform owner review** (web or mobile) for behavior parity.
4. **QA evidence check** for critical flow smoke.

## Governance Cadence
- Weekly design-system triage:
  - Token requests
  - Drift findings
  - Planned deprecations
- Monthly audit snapshot:
  - Legacy token usage trend
  - Component conformance trend
  - Open P0/P1 visual debt

## Escalation Rules
- If a change breaks token policy in critical surfaces (auth/dashboard/mobile core), block merge until resolved.
- If rollout deadlines require exception, record a temporary waiver with:
  - File scope
  - Expiration date
  - Owner
  - Follow-up issue/task
