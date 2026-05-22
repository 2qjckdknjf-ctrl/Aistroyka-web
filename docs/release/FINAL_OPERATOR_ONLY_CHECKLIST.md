# FINAL OPERATOR-ONLY CHECKLIST

Date: 2026-05-22  
Project: AISTROYKA

## Remaining external items

| Item | Owner | Current status | Exact action needed | Blocks Web/API release | Blocks mobile publication | Blocks full public launch |
|---|---|---|---|---|---|---|
| iOS TestFlight full runtime proof package | Mobile lead + QA | PARTIAL | Execute full worker/manager transaction chain on target build, attach artifacts to `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md` and TestFlight checklist | No (web/api) | Yes | Yes |
| Android publication readiness track | Android lead | DEFERRED | Decide launch scope (deferred vs publish), complete deferred backlog and publication evidence if enabling release | No (web/api) | Yes | Yes (if claiming full multi-platform GA) |
| AI provider-backed non-fallback verification | AI/platform owner | PARTIAL | Run production deploy AI gate with live provider validation until `analyze-image` no longer degraded; update `docs/publication-readiness/AI_LIVE_PROVIDER_VALIDATION_REPORT.md` | No (with degraded policy) | No | Yes (for full non-beta AI claim) |
| Strict pilot prereq env material (`ops/metrics` auth + E2E creds + Supabase PAT) | Release operator | BLOCKED (env missing locally) | Provide secure runtime values for `AUTH_HEADER` or `COOKIE` or `SMOKE_EMAIL/SMOKE_PASSWORD`, `E2E_EMAIL`, `E2E_PASSWORD`, `PLAYWRIGHT_BASE_URL`, `SUPABASE_ACCESS_TOKEN`, then rerun `bun run smoke:pilot:check --strict` and `scripts/smoke/pilot_launch.sh` | Conditional (depends on release policy) | No | Yes (for hard operator signoff) |
| Legal status canonical file requested by release brief (`docs/06_PRIVACY_LEGAL_STATUS.md`) | Legal/compliance owner | MISSING IN REPO | Create canonical legal status doc with privacy policy URL, terms URL, data processing/legal review status, publication readiness verdict | No (runtime) | No | Yes |
| Operator signoff template requested by release brief (`docs/_operator/release-signoff-template.md`) | Release manager | MISSING IN REPO | Add signoff template and capture named approvals (engineering/security/product/ops) | No (runtime) | No | Yes |
| Apple account / App Store Connect publication config | iOS release manager | EXTERNAL | Verify distribution cert/profiles, app metadata, privacy nutrition labels, release track settings | No | Yes | Yes |
| Google Play production config | Android release manager | EXTERNAL/DEFERRED | If Android release is enabled: verify signing, Data safety form, store listing, release tracks | No | Yes | Yes |
| Push credentials lifecycle (APNs/FCM) | Mobile ops | EXTERNAL | Verify APNs key/cert rotation and FCM production key/config in secret stores | No | Yes | Yes |
| Production secret governance (Cloudflare/Supabase/GitHub) | Platform ops | PARTIAL | Re-confirm secret inventory/rotation policy and change log; keep `STAKEHOLDER_SMOKE_*` scoped to stakeholder-only account | Potentially | Potentially | Yes |

## Notes

- Stakeholder finance live gate is now closed and should remain strict: no admin/owner fallback.
- This checklist tracks only items not closable purely by repository code changes.
