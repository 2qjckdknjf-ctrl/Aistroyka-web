# Release Channels and Environment Discipline

**Phase 6 — Pilot Deployment & Observability**

---

## Dev / Staging / Production separation

| Environment | Purpose | Web (dashboard) | API base (mobile) | Typical URL |
|-------------|---------|------------------|-------------------|-------------|
| **Development** | Local work | `localhost:3000` | `http://localhost:3000` or env | N/A |
| **Staging** | Pre-production testing | Staging deploy (e.g. Vercel preview or staging subdomain) | Staging API URL from build/env | Staging app URL |
| **Production** | Live pilot and beyond | Production domain | Production API URL | Production app URL |

- **Web:** `NODE_ENV`, `VERCEL_ENV` (preview/production), and app URL from config.
- **iOS:** `BASE_URL` (and Supabase keys) from Info.plist or environment; different schemes/targets or build configs per environment.
- **Backend:** Same codebase; env vars (e.g. `NEXT_PUBLIC_*`, `SUPABASE_*`, `OPENAI_*`) differ per deploy.

---

## Environment config strategy

- **Backend (Next.js):** Server config in `lib/config/server.ts`; public env in `lib/env`; no secrets in client bundle.
- **iOS:** Config in `Config.swift` from `Bundle.main` (Info.plist) and `ProcessInfo.processInfo.environment`; use build configurations (Debug/Release) and optionally xcconfig per environment (dev/staging/prod).
- **Secrets:** API keys, service role keys, Sentry DSN, etc. in environment only; never committed. Use Cloudflare/Vercel env and iOS Keychain/entitlements as appropriate.

---

## iOS TestFlight readiness

- **Versioning:** Use `CFBundleShortVersionString` (marketing version, e.g. 1.0.0) and `CFBundleVersion` (build number, e.g. 42). Increment build for every TestFlight upload.
- **Checklist:** (1) Set correct BASE_URL/API for TestFlight build. (2) Archive and upload to App Store Connect. (3) Submit to TestFlight; add internal/external testers. (4) Release notes and “What to test” for pilot.
- **Signing:** Use distribution certificate and provisioning profile for TestFlight/App Store.

---

## Android internal testing readiness

- **Status:** No Android app in repo yet. When added: use internal testing track (Google Play Console); versionCode and versionName in build.gradle; environment config (build types or flavor) for API base URL.
- **Checklist (when applicable):** (1) Build variant with correct API URL. (2) Upload AAB to internal testing. (3) Add testers; share opt-in link.

---

## Versioning / build numbering strategy

- **Semantic versioning:** Major.Minor.Patch (e.g. 1.0.0) for product version.
- **Build number:** Monotonically increasing integer per upload (TestFlight, Play, or web deploy). Tied to commit or CI build id when possible.
- **Pilot:** Start at 1.0.0 (or current) with clear build numbers so feedback can be mapped to “version X build Y”.

---

## Release checklist

- [ ] All pilot-critical tests passing (backend, web, iOS).
- [ ] Environment config verified for target (staging/prod).
- [ ] Secrets loaded from env; no hardcoded keys.
- [ ] Version and build number set; release notes updated.
- [ ] iOS: TestFlight build uploaded and testers notified.
- [ ] Web: Deploy to target env; smoke check dashboard and API.
- [ ] Notify pilot tenant(s) of release and how to report issues.

---

## Rollback checklist

- [ ] Identify failing deploy or build (env, version, build number).
- [ ] Backend/Web: Revert to previous deploy or trigger previous deployment.
- [ ] iOS/Android: Previous build remains available on TestFlight/Play; instruct users to install previous version if needed; fix forward preferred when possible.
- [ ] Communicate to pilot: “We’ve rolled back X; please use version Y until next update.”
- [ ] Post-incident: Document cause and improve tests or guards.

---

## Secrets handling discipline

- Do not commit `.env`, `.env.local`, or any file containing secrets.
- Use platform secrets (Vercel, Cloudflare, App Store Connect, Google Play) for keys and DSNs.
- Rotate keys if ever exposed; document rotation in runbooks.
- Pilot-specific keys (e.g. Sentry project) should be separate from production if needed for isolation.
