# iOS — TestFlight pilot (Phase 10)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Prerequisite:** Phase 9 **Layer B** checklist executed on a release candidate (see `IOS_E2E_VALIDATION_REPORT.md`).

## Scope

Two **separate** App Store products (per `AGENTS.md` — do not merge Worker and Manager):

| App | Xcode project | Bundle ID (from `.pbxproj`) |
|-----|----------------|------------------------------|
| **AiStroyka Worker** | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | `ai.aistroyka.worker` |
| **AiStroyka Manager** | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` | `ai.aistroyka.manager` |

UITest targets use `*.uitests` bundle suffixes — register only the **application** targets in App Store Connect.

---

## Preconditions (org / Apple)

- **Apple Developer Program** membership; **App Store Connect** access.  
- **Team ID** set on both projects for **Archive** (Release), not only simulator `CODE_SIGNING_ALLOWED=NO`.  
- **Distribution signing** + **App Store provisioning** profiles for each bundle ID.  
- **App Store Connect:** create two apps if not already present; enable **TestFlight**.

---

## Build-time configuration (real API)

`Info.plist` injects:

- `BASE_URL` — must point to pilot/staging/prod web/API host (`Config.apiBaseURL` resolves to `{BASE_URL}/api/v1`).  
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — same Supabase project users authenticate against.

Use **Release** `xcconfig` / CI secrets; do **not** commit real keys (see `ios/Config/Secrets.xcconfig.example`).

---

## Privacy and compliance

- **Worker:** `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` in `Info.plist`.  
- Export / encryption: complete **App Store Connect** encryption questionnaire per Apple guidance.  
- Privacy Nutrition Labels if the build collects additional categories beyond documented help/activation calls.

---

## Suggested pilot flow

1. Complete **Layer B** on an internal staging build; capture notes in `IOS_E2E_VALIDATION_REPORT.md`.  
2. **Archive** each app in Xcode (Product → Archive); **Validate** → **Distribute** to App Store Connect.  
3. **Internal Testing** first; **External** if needed (Beta App Review).  
4. Pilot users install via **TestFlight**; verify login, reports, review, evidence, resubmit, help card against the same backend as the build’s `BASE_URL`.  
5. Track crashes in **Xcode Organizer** (or linked crash reporter).

---

## Phase 10 closure

### A. PHASE STATUS (this repository pass)

**PARTIAL — RUNBOOK ONLY**

- **Delivered:** This document as the **Phase 10 checklist**.  
- **Not delivered here:** Binary upload, Beta Review, or a filled pilot log (org-specific).

### B. Pilot log (append when real)

| Build | Worker build # | Manager build # | API base | Layer B ref | Notes |
|-------|----------------|-----------------|----------|-------------|-------|
| *(TBD)* | | | | | |

### C. Overall roadmap

See `IOS_FINAL_MOBILE_READINESS_VERDICT.md`. **Pilot-ready** requires **Layer B** evidence plus at least one **TestFlight** cycle without show-stopper defects.

---

*End of Phase 10 runbook.*
