# AISTROYKA Master Risk Register

Updated: 2026-05-01

## P0 Risks

- None confirmed from local code/build/test validation in this pass.

## P1 Risks

1. **Operational verification dependency on external secrets**
   - Evidence: live smoke/deploy checks require Cloudflare/Supabase credentials not available in this local pass.
   - Impact: production readiness cannot be proven 100% from local environment alone.
   - Mitigation: run post-audit operator command set in secured environment.
   - Owner: Release/Ops.

2. **Bun runtime version drift**
   - Evidence: repo pins `bun@1.2.15`, local run used `1.3.12`.
   - Impact: subtle behavior differences between local and CI.
   - Mitigation: enforce pinned Bun via toolchain manager or CI/dev setup script.
   - Owner: Platform.

## P2 Risks

1. **Workspace/lockfile drift**
   - Evidence: root Bun lock + package-level npm lockfiles.
   - Impact: potential dependency graph drift if teams mix package managers.
   - Mitigation: standardize lockfile policy and prune stale package-lock files in a dedicated hygiene pass.

2. **Android AGP warning (`compileSdk=34` with AGP 7.4.2)**
   - Build passes but tooling is behind latest recommendation.
   - Mitigation: planned Gradle/AGP upgrade window.

3. **Large repository operational noise**
   - Many archived docs/artifacts and generated local directories increase cognitive load.
   - Mitigation: periodic hygiene pass for docs/artifacts and clearer archival boundaries.

4. **Legacy `/api/*` compatibility breadth**
   - Legacy and canonical routes coexist.
   - Mitigation: publish formal deprecation map and sunset schedule after client telemetry.
