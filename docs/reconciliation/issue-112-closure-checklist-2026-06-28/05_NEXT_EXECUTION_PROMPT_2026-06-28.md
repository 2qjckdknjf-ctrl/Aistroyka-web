# Next Execution Prompt (2026-06-28)

Two branches depending on the owner decision recorded in `04_CLOSE_OR_KEEP_OPEN_VERDICT`.

## Branch A — Owner confirms closure (preferred if audit-only scope accepted)

Prompt outline:
- Act as Issue #112 Closure Operator.
- Verify this closure-checklist PR is merged.
- Post the exact closing comment from `04_CLOSE_OR_KEEP_OPEN_VERDICT_2026-06-28.md`.
- Close issue #112 **only** after explicit owner confirmation in the request.
- Open separate follow-up issues for iOS store readiness, Android store readiness, live pilot confirmation.
- No code, no deploy, no store upload.

## Branch B — Owner wants store/distribution evidence before any close

Prompt outline (store-readiness preflight, evidence-only):
- Act as Mobile Store Readiness Preflight Operator.
- **iOS:** inspect signing/provisioning availability (Team `43A4KW5BKB`, bundle ids `ai.aistroyka.worker` / `ai.aistroyka.manager`, ASC API `.p8`); do **not** upload. Record what archive/export/upload would require; mark BLOCKED if certs/profiles absent.
- **Android:** inspect `android/keystore.properties` + signing config presence (gitignored); do **not** sign-release or upload. Record AAB/Play preconditions; mark BLOCKED if keystore absent.
- No release signing, no TestFlight/App Store/Play upload, no deploy.
- Produce a dated docs-only store-readiness preflight report; open PR only.

## Guardrails (both branches)

- Never auto-close issue #112 without explicit owner confirmation.
- No store upload / release signing without explicit, separately-scoped approval and evidence.
- Keep each step a small, validated, docs-or-evidence-only slice.
