# AISTROYKA Pilot Intake Card

**Version:** 1.0  
**Date:** 2026-07-03  
**Purpose:** Single fillable artifact for the first real client pilot. Pair with machine-readable JSON for validation.

**How to use**

1. Fill this card (or copy `docs/launch/pilot-intake.template.json` → `docs/launch/pilot-intake.real.local.json` **gitignored**).
2. Validate: `bun run pilot:intake:validate -- docs/launch/pilot-intake.real.local.json`
3. When **READY**, proceed with Day 0 runbooks in `docs/launch/P4_*` and `PILOT_DAY0_*`.

**Do not commit** real client PII or credentials to git. Store filled JSON in a secure operator location.

---

## 1. Client / Company

| Field | Value |
|-------|-------|
| **Company name** | |
| Legal/company identifier (optional) | |
| **Main sponsor/contact** | |
| Sponsor role | |
| **Phone** | |
| **Email** | |
| **Preferred language** | `en` / `ru` / `es` / `it` / other |
| **Timezone** | |
| Notes | |

**Launch-critical:** company name, sponsor name, sponsor email.

---

## 2. Pilot Project

| Field | Value |
|-------|-------|
| **Project name** | |
| Project address/site | |
| **Project type** | ☐ renovation ☐ construction ☐ maintenance ☐ other: ______ |
| **Pilot start date** | |
| Pilot end date | |
| Expected pilot duration | Default: **4 weeks** |
| **Site internet quality** | ☐ good ☐ medium ☐ poor |
| Site access notes | |

**Launch-critical:** project name, start date.

---

## 3. Pilot Users and Roles

### Owner / Admin

| Field | Value |
|-------|-------|
| Name | |
| **Email** | |
| Phone | |
| Role | owner / admin |

### Managers

| Name | Email | Phone | iPhone available YES/NO | Notes |
|------|-------|-------|-------------------------|-------|
| | | | | |
| | | | | |

**Minimum:** 1 manager.

### Workers

| Name | Email/Phone | iPhone YES/NO | Android-only YES/NO | Assigned tasks | Notes |
|------|-------------|---------------|---------------------|----------------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

**Minimum:** 2 workers recommended; 1 absolute minimum with owner acceptance.

### Stakeholder / Client Users

| Name | Email | Role | Portal access YES/NO | Notes |
|------|-------|------|----------------------|-------|
| | | client_viewer / client_decision_maker | | |

---

## 4. Device Readiness

| Field | Value |
|-------|-------|
| Workers have iPhone | YES / NO / PARTIAL |
| Managers have iPhone | YES / NO / N/A (web-only OK) |
| **Any Android-only workers** | **YES / NO** (if YES → see P3 defer) |
| **Android-only check confirmed by operator** | YES / NO |
| TestFlight access ready | YES / NO |
| Apple IDs available for testers | YES / NO |
| Internet on site | good / medium / poor |
| Device blockers | |

**Launch-critical:** confirm Android-only answer; all field workers need iPhone OR explicit web-only path.

---

## 5. Pilot Scope

For each item: **Included** YES/NO · **Required for launch** YES/NO · **Notes**

| Scope item | Included | Required for launch | Notes |
|------------|----------|---------------------|-------|
| Worker daily reports | | YES | |
| Before/after photo evidence | | YES | |
| Manager approvals | | YES | |
| Request changes / resubmit | | YES | |
| Documents / acts / contracts | | NO | |
| Costs / budget (internal managers only) | | NO | Never expose internal finance to portal |
| Stakeholder/client portal | | NO | |
| Schedule/milestones | | NO | |
| AI/intelligence/project health | | NO | |
| Notifications | | NO | |
| **Android support** | **NO** (default) | **NO** | Deferred per P3 |

---

## 6. Environment Decision

| Field | Value |
|-------|-------|
| **Pilot environment** | ☐ **staging** ☐ **production dedicated pilot tenant** |
| Real client data used | YES / NO |
| Synthetic/demo data used | YES / NO |
| **Production mutation authorized by owner** | YES / NO (required if production) |
| Production tenant name | |
| Data cleanup/reset plan | |

**Rule:** Staging first. Production only with owner **YES** and isolated tenant.

---

## 7. Support

| Field | Value |
|-------|-------|
| **Support email** | |
| Support WhatsApp/Telegram | |
| Support owner (AISTROYKA) | |
| Escalation contact | |
| Support hours | |
| Emergency issue protocol | |

**Launch-critical:** support email **or** another documented support channel.

---

## 8. Day 0 Checklist

| Item | Done |
|------|------|
| Client selected | ☐ |
| Sponsor confirmed | ☐ |
| Project confirmed | ☐ |
| Support contact confirmed | ☐ |
| Android requirement checked | ☐ |
| iOS devices ready | ☐ |
| TestFlight installed | ☐ |
| Tenant/account created | ☐ |
| Project created | ☐ |
| Managers invited | ☐ |
| Workers invited | ☐ |
| Stakeholder invited | ☐ |
| Tasks created | ☐ |
| Milestones created | ☐ |
| Documents prepared | ☐ |
| Costs prepared | ☐ |
| Worker report/media smoke passed | ☐ |
| Manager approval smoke passed | ☐ |
| Stakeholder visibility smoke passed | ☐ |
| **Known limitations accepted** (TestFlight, no Android, not GA) | ☐ |
| **Owner signoff** | ☐ |
| Client signoff | ☐ |

---

## 9. GO / NO-GO Decision

| Field | Value |
|-------|-------|
| **Launch allowed** | YES / NO |
| Reason | |
| Blocking items | |
| **Owner signoff** | Name + date + APPROVED |
| Client signoff | Name + date + APPROVED |
| Decision date | |
| Next action | |

---

## Machine-readable companion files

| File | Purpose |
|------|---------|
| `docs/launch/pilot-intake.template.json` | Empty schema — copy to local gitignored file |
| `docs/launch/pilot-intake.example.json` | Safe demo values (`example.com` only) |
| `scripts/pilot/validate_pilot_intake.mjs` | Local GO/NO-GO readiness check |

```bash
node scripts/pilot/validate_pilot_intake.mjs docs/launch/pilot-intake.example.json
```

---

## Related docs

- `docs/launch/P4_PILOT_CLIENT_INTAKE.md`
- `docs/launch/P4_LAUNCH_GO_NO_GO_CHECKLIST.md`
- `docs/launch/PILOT_DAY0_GO_NO_GO.md`
- `docs/mobile/P3_ANDROID_DEFER_DECISION.md`
