# AISTROYKA Android agent alignment

This file supplements root `/AGENTS.md` for work under `android/`.

Before AI/vision/daily-report/client-intake mobile work, read:
- `/PROJECT_CONTEXT.md`
- `/STATUS.md`
- `/docs/roadmap/AISTROYKA_AI_INTELLIGENCE_SEQUENCE.md`

Rules:
- Android is a secondary/thinner mobile contour until iOS is product-ready; do not widen Android scope merely to chase a new AI feature.
- Do not merge Manager and Worker; shared logic belongs in the existing shared module.
- Android consumes canonical backend/domain intelligence; do not fork a second Construction Graph, evidence engine, agent policy layer or provider-specific source of truth into Kotlin.
- Worker vision work starts only at `AIS-VISION-003` after `AIS-EVID-002`; manager/human approval remains authoritative.
- Client video/intake comes only at `AIS-CLIENT-005` after Construction Graph 2.0.
- Preserve release signing, test-tag, emulator smoke and Play gates from root `AGENTS.md`.
- Implement one dependency-satisfied `AIS-*` slice, validate it, record evidence, and stop at its gate.