# Security notes — release 2026-03-05

## Next.js version (14.2.18)

- **Current:** next@14.2.18 (locked in package.json / apps/web).
- **Advisory:** Next.js security update Dec 2025 and related CVEs (e.g. middleware auth bypass CVE-2025-29927, DoS CVE-2026-23864) recommend upgrading to a patched 14.2.x (e.g. 14.2.25+ or 14.2.35).
- **Sources:** https://nextjs.org/blog/security-update-2025-12-11, https://nextjs.org/cve-2025-66478, GitHub advisories GHSA-9qr9-h5gf-34mp, GHSA-f82v-jwr5-mffw.
- **Decision:** No automatic major or minor upgrade in this release. Recommended follow-up: in a dedicated change, bump to latest 14.2.x patch (e.g. `npm i next@14.2.25` or latest 14.2.x in apps/web and root), run full test and build, then deploy.

## Config hardening (this release)

- **poweredByHeader:** Set to `false` in next.config to avoid disclosing Next.js in response headers.
- **Security headers:** Already applied via `lib/security-headers.ts` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy). No CSP added (would require audit to avoid breaking).

## Secrets

- No secrets committed. `.env.example` lists variable names only; values are placeholders or omitted for server-only keys.
