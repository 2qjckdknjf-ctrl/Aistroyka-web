# AISTROYKA iOS agent alignment

This file supplements root `/AGENTS.md` for work under `ios/`.

Before AI/vision/daily-report/client-intake mobile work, read:
- `/PROJECT_CONTEXT.md`
- `/STATUS.md`
- `/docs/roadmap/AISTROYKA_AI_INTELLIGENCE_SEQUENCE.md`

Rules:
- iOS remains the primary mobile contour and current pilot/store/device gates stay ahead of new AI UX.
- Do not merge Manager and Worker; shared logic belongs in `ios/Shared`.
- Mobile is a client of canonical backend/domain intelligence; do not fork a second Construction Graph, risk/policy engine or model-specific source of truth into Swift.
- Worker vision work starts only at `AIS-VISION-003` after `AIS-EVID-002`; manager remains the approver of work reports.
- Client video/intake comes only at `AIS-CLIENT-005` after Construction Graph 2.0; do not jump directly from video to matching.
- Preserve live-data/test-preview boundaries and all signing/store rules in root `AGENTS.md`.
- Implement one dependency-satisfied `AIS-*` slice, run simulator/E2E validation required by the repo, record evidence, and stop at its gate.