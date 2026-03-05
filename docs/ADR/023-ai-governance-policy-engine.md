# ADR-023: AI governance policy engine

**Status:** Accepted  
**Decision:** Implement AI governance: policy.types, policy.rules (tier, resource type, max image size/count), policy.service (runPolicy, checkPolicy, recordPolicyDecision), redaction.service (regex for email/phone, no heavy NLP), model-routing.service (FREE→gpt-4o-mini, PRO/ENTERPRISE→gpt-4o + fallback). Persist decisions in ai_policy_decisions. All AI calls run policy before execution; handlers call checkPolicy + recordPolicyDecision (or runPolicy). Redaction is optional on text inputs; log when redaction occurs.

**Context:** Phase 4.4 enterprise AI governance (allow/deny by tier, limits, model routing, optional redaction).

**Consequences:** Block/degrade decisions prevent or downgrade AI calls. Model tier can be passed to runVisionAnalysis for model selection when wired. Redaction is best-effort and regex-only.
