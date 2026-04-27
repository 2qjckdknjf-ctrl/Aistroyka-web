# Contextual upgrade prompts (Step 11)

**Status:** Step 11 — feature-unavailable surfaces, non-blocking.

## Purpose

Provide contextual upgrade prompts when a feature/section is unavailable on the current plan. Soft, non-blocking surfaces with safe CTA to billing. No paywall, no checkout.

## Prompt model

- **View model:** `UpgradePromptViewModel` in `upgrade-prompt.types.ts`.
- **Builder:** `getUpgradePromptForCapability(capabilityKey, surface)` in `upgrade-prompt.ts`.
- **Fields:** capabilityKey, currentPlanCode, requiredPlanCode, promptVariant, title, description, ctaLabel, ctaTargetRoute, severity, showPrompt, isLegacyBridge.

## Capability mapping

- **Config:** `CAPABILITY_PROMPT_CONFIG` in `upgrade-prompt-config.ts`.
- **Capabilities:** advancedApprovals, advancedDocuments, portfolioAnalytics, managerAi, integrations, sso, auditLogs, apiAccess.
- **Prompt variants:** feature_unavailable, explore_higher_plan, enterprise_contact.
- **Required plans:** Business Operations for most; Enterprise for sso, auditLogs.

## CTA policy

- **Target route:** Always `/billing`. Never checkout or provider URL.
- **Labels:** "Explore Business Operations", "Contact us for enterprise rollout", "Explore plan options".
- **Forbidden:** Buy now, Start paid trial, Add card, Upgrade instantly.

## Integration points

1. **Billing page:** `AvailableWithHigherPlans` — lists disabled capabilities with upgrade prompts.
2. **Portfolio page:** `CapabilityGate` for portfolioAnalytics — shows upgrade card when unavailable.
3. **Approvals page:** `InlineUpgradeHint` for advancedApprovals — compact hint when unavailable.

## UI components

- **FeatureUpgradePromptCard** — card or inline variant.
- **CapabilityGate** — wraps children; shows upgrade prompt when capability disabled.
- **InlineUpgradeHint** — compact inline hint.
- **AvailableWithHigherPlans** — billing section listing disabled capabilities.

## Fallback policy

- Surface missing → no prompt (graceful degradation).
- Enterprise → no upgrade prompt.
- Legacy bridge → safe copy, isLegacyBridge flag.

## Legacy safety

- No aggressive prompts for legacy users.
- Copy remains informational.
- CTA always safe internal route.
