# PHASE 0 — Release 1 risks (concrete)

**Severity key:** **P0** = could block launch or cause data/security incident; **P1** = major product degradation; **P2** = manageable with workarounds.

---

## P0 — Platform & build

| Risk | Why it matters | Verify before R1 implementation |
|------|----------------|-----------------------------------|
| **iOS has no Xcode project in repo** | Cannot reproduce iOS builds from clone alone; CI may not build iOS. | Confirm where `.xcodeproj` lives (machine, separate repo, generated). Add CI or document mandatory steps. |
| **Dual CI definitions** | Root `.github/workflows/*` vs `apps/web/.github/workflows/ci.yml` may confuse which gates run. | Check GitHub **Actions** tab for this repository’s active workflows. |
| **Supabase RLS / migration drift** | API assumes DB policies match migrations; drift → 403/RLS errors at runtime. | Process: apply migrations to target project; smoke `pilot_launch.sh` + worker/media paths. |

---

## P0 — Auth & tenant

| Risk | Why it matters | Verify |
|------|----------------|--------|
| **Wrong Supabase client on API routes** | `createClient()` vs `createClientFromRequest` historically caused **403** on worker writes for Bearer-only mobile. | Audit diff or grep route files; integration test with Bearer. |
| **Lite allow list misconfiguration** | Blocks legitimate mobile calls or allows wrong surface. | Contract test `lite-allow-list.test.ts` + device smoke with `x-client`. |

---

## P1 — Cross-platform product

| Risk | Why it matters | Verify |
|------|----------------|--------|
| **Android debug pilot bypass** | `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` allows submit without photo in **debug** — launch proof may not match production rules. | Separate **release** build proof or `-PpilotRealSubmit=true` documented run. |
| **iOS JSON decoding + snake_case** | `APIClient` uses `convertFromSnakeCase`; explicit `CodingKeys` can null out fields (e.g. `upload_path`) — caused wrong storage prefix in prior analysis. | Integration tests / device logs for upload session response shape. |
| **Placeholder mobile UIs** | iOS Manager has `*PlaceholderView.swift` files — feature claims may be false. | Map each tab to API + UI reality. |

---

## P1 — Scope creep

| Risk | Why it matters | Verify |
|------|----------------|--------|
| **AI brain multi-phase library** | Large surface (`lib/ai-brain/**`); easy to break unrelated behavior. | Explicit R1 exclusion list; only touch if in scope. |
| **Billing pilot / Stripe** | Side effects on money + entitlements. | If R1 excludes billing, freeze changes to webhook + pilot routes. |

---

## P2 — Operations

| Risk | Why it matters | Verify |
|------|----------------|--------|
| **Cloudflare bundle / worker size** | Local `cf:deploy:prod` notes in AGENTS — size limits. | CI is source of truth for prod deploy. |
| **Documentation contradictions** | e.g. `FIRST_CLIENT_SCOPE_LOCK.md` Android photo row vs current Kotlin — wrong planning decisions. | Use **this Phase 0** + repo paths, not stale tables. |

---

## P2 — Testing gaps

| Risk | Why it matters | Verify |
|------|----------------|--------|
| **No Android unit/instrumented tests in Gradle** | Regressions caught late. | Add minimal tests or manual test protocol for R1. |
| **E2E** | Playwright specs exist (`apps/web/tests/e2e/*.spec.ts`) but coverage unknown. | List which golden paths are e2e-covered. |

---

## What must be verified before R1 **implementation** (checklist)

1. **Deploy target** — Cloudflare production vs any legacy host; single source in team runbook.  
2. **Mobile proof** — At least one **Worker** + **Manager** contour per platform with **real API** + **media** rules intended for launch.  
3. **Contract package** — `packages/contracts` version aligned with deployed API.  
4. **Secrets** — None in git; `.env.example` files complete for web; mobile config documented.  
5. **Rollback** — Who can revert deploy; `STAGE5_ROLLBACK_AND_SUPPORT.md` (launch docs) if still applicable.

---

## Modules safe to narrow (not “broken”, but optional)

- `paperclip/**` — exclude from Aistroyka R1 unless product merges efforts.  
- `docs/**` historical audits — reference only.  
- `packages/api-client` — optional SDK; web does not depend on it at runtime (`package.json` self-description).
