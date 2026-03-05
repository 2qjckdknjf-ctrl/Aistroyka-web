# ADR-035: Multi-provider AI routing and circuit breaker

**Status:** Accepted  
**Decision:** Provider interface (invokeVision → VisionResult with providerUsed, modelUsed). OpenAI provider implemented; Anthropic and Gemini stubs. Router selects by tier and circuit state; fallback to next provider on failure. Circuit breaker: ai_provider_health (provider, state closed|open|half_open, failure_count, last_failure_at); open after threshold failures; canInvoke false when open. Record success/failure after each call; emit alerts on open (handled by alert service). AI response contract includes providerUsed + modelUsed.

**Context:** Phase 5.4; resilience and cost optimization.

**Consequences:** Existing analyze-image can stay on runVisionAnalysis or switch to router; job handlers can use router for at-least-once with fallback.
