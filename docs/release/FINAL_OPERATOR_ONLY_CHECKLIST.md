# FINAL OPERATOR-ONLY CHECKLIST

Date: 2026-05-22  
Project: AISTROYKA

## Remaining external items

| Item | Owner | Current status | Exact action needed | Blocks Web/API release | Blocks mobile publication | Blocks full public launch |
|---|---|---|---|---|---|---|
| iOS TestFlight full runtime proof package | Mobile lead + QA | OPERATOR_REQUIRED | Execute full worker/manager transaction chain on target build, attach artifacts to `docs/release/IOS_FULL_RUNTIME_PROOF.md`, `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md`, and TestFlight checklist | No (web/api) | Yes | Yes |
| Android publication decision | Android lead + release owner | **DEFER_ANDROID_PUBLICATION** | Keep Android out of public release scope; if policy changes, complete `docs/publication-readiness/ANDROID_HARDENING_BACKLOG.md` and publication evidence first | No (web/api) | Yes (Android publication) | Yes (if claiming full multi-platform GA) |
| AI provider-backed non-fallback verification | AI/platform owner | PARTIAL | Run production deploy AI gate with live provider validation until `analyze-image` no longer degraded; update `docs/publication-readiness/AI_LIVE_PROVIDER_VALIDATION_REPORT.md` | No (with degraded policy) | No | Yes (for full non-beta AI claim) |
| Strict pilot prereq env material (`ops/metrics` auth + E2E creds + Supabase PAT) | Release operator | PARTIAL | `--strict` auth-path gate now passes; still provide `E2E_EMAIL`, `E2E_PASSWORD`, `PLAYWRIGHT_BASE_URL`, `SUPABASE_ACCESS_TOKEN` for full pilot/e2e/operator signoff package | No (for strict gate) | No | Yes (for full operator signoff) |
| Legal status canonical file (`docs/06_PRIVACY_LEGAL_STATUS.md`) | Legal/compliance owner | IN_PROGRESS | Fill legal owner-approved final URLs/signoff fields and mark statuses `DONE` with evidence | No (runtime) | Yes (store publication) | Yes |
| Operator signoff template (`docs/_operator/release-signoff-template.md`) | Release manager | IN_PROGRESS | Collect named signoffs (release/security/legal/mobile/ops) and record final signatures | No (runtime) | Yes | Yes |
| Apple account / App Store Connect publication config | iOS release manager | EXTERNAL | Verify distribution cert/profiles, app metadata, privacy nutrition labels, release track settings | No | Yes | Yes |
| Google Play production config | Android release manager | EXTERNAL/DEFERRED | If Android release is enabled: verify signing, Data safety form, store listing, release tracks | No | Yes | Yes |
| Push credentials lifecycle (APNs/FCM) | Mobile ops | EXTERNAL | Verify APNs key/cert rotation and FCM production key/config in secret stores | No | Yes | Yes |
| Production secret governance (Cloudflare/Supabase/GitHub) | Platform ops | PARTIAL | Re-confirm secret inventory/rotation policy and change log; keep `STAKEHOLDER_SMOKE_*` scoped to stakeholder-only account | Potentially | Potentially | Yes |

## Notes

- Stakeholder finance live gate is now closed and should remain strict: no admin/owner fallback.
- This checklist tracks only items not closable purely by repository code changes.
- Android decision for this release lock pass: `DEFER_ANDROID_PUBLICATION` (based on deferred backlog policy + no full publication evidence).
