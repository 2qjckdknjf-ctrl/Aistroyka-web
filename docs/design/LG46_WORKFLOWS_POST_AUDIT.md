# LG-4.6 Workflows Post-Audit

**Date:** 2026-06-19  
**Route:** `/[locale]/workflows`

## Re-audit vs LG46 boundary/truth audits

| Criterion | Pre-LG-4.6 | Post-LG-4.6 |
| --- | --- | --- |
| Primary question owned | Partial | ✅ “Which paths run automatically today?” |
| LIVE/PARTIAL/PLANNED on all claims | Examples only | ✅ Matrix, timeline, live, roadmap |
| Platform/Features navigation | Missing | ✅ Related links |
| Benefits truth gap | P1 | ✅ Removed |
| i18n related leakage | P2 | ✅ Fixed all locales |
| PublicPageHero | Missing | ✅ Added |
| Glass budget | 1 CTA only | ✅ 1 highlight + 1 CTA |

## Truth matrix (code-aligned)

| Path / capability | Label on page | Code anchor |
| --- | --- | --- |
| Issue → notify | PARTIAL | `issue.service.ts` notify; manual create |
| Overdue follow-up | PARTIAL | Manager actions; noop escalation |
| Missing evidence | PARTIAL | Insights; noop auto-request |
| Report → analysis queue | PARTIAL | Notify + job enqueue; no-op report handler |
| Risk alerting | PLANNED | noop `create_alert_record` |
| Manual review queues | LIVE | `pending-approvals.service.ts` |
| Manager notifications | LIVE | `manager_notifications` |
| Automation engine | PLANNED | `action-dispatcher.ts` noop |

## Navigation paths verified (code)

| Outbound | In page |
| --- | --- |
| `/platform` | ✅ |
| `/features` | ✅ |
| `/mobile` | ✅ |
| `/ai-construction-control` | ✅ |
| `/implementation` | ✅ |
| `/contact` | ✅ + CTA |

## Validation

| Command | Result |
| --- | --- |
| `bun run --cwd apps/web check:design` | **PASS** |
| `bun run lint` | **PASS** |
| `tsc --noEmit` | **PASS** |
| `bun run i18n:check` | **PASS** |
| `I18N_CHECK_ALL=1 bun run i18n:check` | **PASS** |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |
| `bun test public-workflows-inventory.test.ts` | **PASS** |

## Verdict

**POST-AUDIT PASS** — P1/P2 blockers from LG-4.6 pre-audit closed.
