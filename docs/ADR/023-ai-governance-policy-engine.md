# ADR-023: AI governance policy engine

**Status:** Accepted  
**Decision:** Add ai-governance module: policy.types, policy.rules (tier + max image size/count), policy.service (checkPolicy, recordPolicyDecision), redaction.service (regex PII), model-routing.service (tier → primary/fallback model). Persist decisions in ai_policy_decisions. AI job handlers run policy before execution and record decision; block throws. Redaction is optional placeholder (emails/phones); log when applied.

**Context:** Phase 4.4 enterprise AI governance (allow/deny by tier, limits, model routing, audit).

**Consequences:** All AI calls should run checkPolicy and recordPolicyDecision; handlers block on decision "block". Model override can be passed to runVisionAnalysis in a follow-up.
