# RELEASE BLOCKERS — INTEGRATION (FACTUAL)

**Audit date:** 2026-04-02  
Only items with **concrete** engineering or evidence gaps are listed. No speculation.

---

## B1 — iOS end-to-end contour not evidenced at program level

- **Evidence:** `docs/launch/STAGE4_CROSS_PLATFORM_TRUTH_MATRIX.md` states iOS Worker/Manager Maestro **not proven** end-to-end while Android has UUID proof.
- **Impact:** Cannot claim App Store–ready field worker parity vs Android pilot.
- **Remediation:** Run iOS Maestro/device flows; record report IDs and review states in STAGE4 docs.

## B2 — Gradle / Xcode production build not executed in this audit

- **Evidence:** This session ran `npm run build` and `npm test` only.
- **Impact:** Native compile errors, signing, or provisioning issues would **not** have been caught.
- **Remediation:** Run `./gradlew :AiStroykaWorker:assembleRelease` (or CI equivalent) and `xcodebuild` archive for both apps; log outputs in CI.

## B3 — Tenant-scoped authenticated smoke not re-run here

- **Evidence:** Prior operator transcripts documented `ops/metrics` **401/403** without valid tenant membership or JWT path.
- **Impact:** Production monitoring and pilot scripts may fail for valid reasons (user not in tenant).
- **Remediation:** Use dedicated tenant test user with confirmed `tenant_members` row; document in `docs/ENVIRONMENT-VARIABLES.md` / internal runbook (no secrets in repo).

## B4 — Production health reports `aiConfigured: false`

- **Evidence:** `curl -L https://aistroyka.ai/api/health` (2026-04-02).
- **Impact:** If this flag gates AI features, public/marketing claims about AI must be qualified.
- **Remediation:** Trace `aiConfigured` in health route implementation; align env and messaging.

---

## Non-blockers (explicitly)

- **Web compile/test:** **Not** a blocker — build and **1245** tests passed locally.
