# Dependency security remediation — 2026-11-27

## Scope and observed problem

Base: `5eeafe9f777b4479ab7655b5191e3c6e1fe38873`. The latest mailed Dependabot failures cover ten security updater jobs and nine distinct packages. Nine root jobs select npm for the Bun workspace and return `misconfigured_tooling`; the separate contracts Zod job cannot infer the installed version without a local lock. Contracts shares the root locks. The affected versions are present in canonical Bun as well as the npm shadow lock, so these are not stale npm-only alerts.

The version-update configuration is handled separately in [PR #530](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/530). GitHub's [supported ecosystem table](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories), including its [source](https://github.com/github/docs/blob/main/data/reusables/dependabot/supported-package-managers.md), distinguishes Bun version-update support from currently unsupported Bun security updates. Correcting that configuration does not itself remediate installed vulnerable versions or prove that native security updater jobs will succeed.

This slice updates both install graphs, migrates the affected Zod consumers, and adds an offline regression guard. Bun 1.2.15 remains canonical; the root npm lock remains required for the Vercel install path. Next and React major versions are preserved. The archived OpenAPI package remains outside the two root workspaces.

## Known-advisory verification boundary

The already retrieved npm audit reported 34 affected package records (15 high, 16 moderate, 3 low; zero critical), including parents affected through dependencies. That is not a count of distinct vulnerabilities. The combined snapshot contains 207 affected ranges for 23 package names: 104 direct advisory rows from the already obtained npm audit, supplemented with ranges from the mailed GitHub jobs. Each range retains a source URL in [known-vulnerabilities.json](../../scripts/ci/known-vulnerabilities.json).

Against the unmodified base locks, this exact snapshot finds **63 vulnerable lock entries: 32 Bun and 31 npm**. Against the updated locks it finds **zero** across **1841 inspected entries**. Nested copies and both lockfiles are checked independently. The guard also rejects unverifiable known-package versions, linked substitutions, malformed data, and package aliases that could otherwise hide an affected dependency.

This is a dated, offline known-advisory regression check. It neither claims a fresh global advisory audit nor predicts future disclosures. Automatic approval review declined a subsequent full dependency-inventory POST to the external npm advisory endpoint; that request was not retried through a different transport or added to CI. The fix uses the already obtained advisory data and package metadata. Existing security alerts/settings are unchanged.

## Dependency choices and compatibility

- **Zod:** [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) lists affected versions below 4.6.6 and no patched 3.x line. Both app and contracts now require `^4.6.6`, resolving to 4.6.7. Explicit record key/value schemas and `error.issues` preserve existing validation behavior under Zod 4. Regression tests cover filled/invalid AI records, boolean action flags and arbitrary nested sync payloads.
- **OpenAPI:** the legacy zod-to-json-schema converter [accepts Zod 3 schemas](https://github.com/StefanTerdell/zod-to-json-schema#deprecation-notice), including when its peer dependency permits Zod 4. Both the current copy and the archived generator actually used by `scripts/generate-openapi.sh` use native `z.toJSONSchema` targeting OpenAPI 3.0. Validation checks all 18 components and resolves document-root references; the CI script exercises both generators and rejects empty/dangling schema fixtures without changing tracked output artifacts.
- **OpenNext/Wrangler:** the updated OpenNext 1.x parent supports patched glob 14, avoiding an unsupported global glob-major override. Wrangler 4.156.2 supplies the updated Miniflare/undici graph while retaining its Node >=22.0 compatibility declaration. Both root and web use the same exact Wrangler version. No deployment command is added or run by this change.
- **Workerd fixture:** Miniflare 5 rejects the existing flat v4 constructor options. Its exported `convertV4MiniflareOptions` adapter preserves the fixture's existing worker options, compatibility flags, outbound handler and telemetry opt-in behavior. The fixture's five real SDK/Workerd scenarios and confinement assertions remain intact.
- **Vitest:** 4.1.12 remains within the existing major and supplies the patched mocker. Its supported Vite graph is resolved consistently in both locks.
- **PostCSS:** a same-major 8.5.34 minimum and override remove the vulnerable nested 8.4.31 pinned by Next, without a Next-major migration. The existing proxy-addr 2.0.8 fix remains intact.
- **Other transitives:** compatible parent/range updates remove the vulnerable copies. The newer AWS XML builder no longer depends on fast-xml-parser, so that package is absent from both root graphs. Remaining glob 7.2.3 is outside this snapshot's affected ranges; it is not forced across a major unnecessarily. Sharp 0.35.5 is selected through Next's declared supported range.

## Installed version matrix

The final versions below are the same in the Bun and npm root locks. Lists include every installed copy of each policy package, including old copies that were already outside an affected range. “Absent” means the dependency is no longer in either graph.

| Package | Relationship | Base Bun versions | Base npm versions | Updated versions, both locks |
| --- | --- | --- | --- | --- |
| `@opennextjs/cloudflare` | Direct build adapter | `1.16.6` | `1.19.11` | `1.20.19` |
| `@vitest/mocker` | Transitive | `4.0.18` | `4.1.8` | `4.1.12` |
| `baseline-browser-mapping` | Transitive | `2.10.0` | `2.10.35` | `2.11.40` |
| `body-parser` | Transitive | `2.2.2` | `2.2.2` | `2.4.0` |
| `brace-expansion` | Transitive | `1.1.12`, `2.0.2`, `5.0.3` | `1.1.15`, `2.1.1`, `5.0.6` | `1.1.22`, `5.1.0` |
| `browserslist` | Transitive | `4.28.1` | `4.28.2` | `4.29.6` |
| `esbuild` | Transitive | `0.25.4`, `0.27.3` | `0.25.4`, `0.27.3` | `0.28.2` |
| `fast-xml-parser` | Transitive | `5.3.6` | `5.7.3` | Absent |
| `form-data` | Transitive | `4.0.5` | `4.0.5` | `4.0.6` |
| `glob` | Transitive | `12.0.0`, `7.2.3`, `9.3.5` | `12.0.0`, `7.2.3`, `9.3.5` | `14.0.6`, `7.2.3` |
| `js-yaml` | Transitive | `4.1.1` | `4.2.0` | `4.3.2` |
| `minimatch` | Transitive | `10.2.2`, `3.1.3`, `8.0.5`, `9.0.6` | `10.2.5`, `3.1.5`, `8.0.7` | `11.0.9`, `3.1.5` |
| `nanoid` | Transitive | `3.3.11` | `3.3.12` | `3.3.20` |
| `postcss` | Direct build dependency; also nested under Next | `8.4.31`, `8.5.6` | `8.4.31`, `8.5.15` | `8.5.34` |
| `postcss-selector-parser` | Transitive | `6.1.2` | `6.1.2` | `6.1.6` |
| `qs` | Transitive | `6.15.0` | `6.15.2` | `6.17.1` |
| `sharp` | Transitive | `0.34.5` | `0.34.5` | `0.35.5` |
| `source-map-js` | Transitive | `1.2.1` | `1.2.1` | `1.2.4` |
| `undici` | Transitive | `7.18.2`, `8.10.0` | `7.24.8`, `8.10.0` | `6.29.1`, `7.30.1`, `8.13.1` |
| `vite` | Transitive | `7.3.1` | `8.0.16` | `8.4.0` |
| `vitest` | Direct test dependency | `4.0.18` | `4.1.8` | `4.1.12` |
| `ws` | Transitive | `8.18.0`, `8.19.0` | `8.20.1` | `8.21.0` |
| `zod` | Direct runtime dependency in web/contracts | `3.25.76` | `3.25.76` | `4.6.7` |

The snapshot file supplies the exact affected range, severity and advisory/job URL for every check; it is the machine-readable companion to this version matrix.

## Validation evidence

- Local checks use Node **24.22.3** and pinned Bun **1.2.15**. The existing `.tool-versions` Node 22.9 entry already falls below engine requirements of dependencies present on the base branch; this slice does not claim validation on Node 22.9 or change the toolchain policy.
- Regression guard: 14 tests pass, including both-lock asymmetry, nested/scoped aliases, prereleases, malformed input, git-URL identities and linked known-package rejection.
- Actual base comparison: 63 matching entries before; zero after.
- Root npm lock structure/platform validator: passes.
- Canonical frozen Bun installation passes with a fresh, isolated cache; the lock is not rewritten. The initial npm-to-Bun import was normalized by Bun before this final frozen check.
- Isolated npm install: `npm ci --ignore-scripts --no-audit --no-fund` passes (776 packages). The npm lock SHA-256 remains `a6255f6772a8e31c656e60f49ce86440b5da661aee47107ccc47dc1f5950cf7a`.
- Isolated npm/Vercel build: the existing nested contracts prebuild, Next 15.5.29 compilation, lint/types, all 411 static pages and traces pass. Manifests and the npm lock remain byte-identical. No service credentials or environment files are loaded; inherited `NPM_CONFIG_AUDIT=false` prevents an implicit new inventory audit in nested npm commands.
- Contracts build and tests: 4 files / 12 tests pass, including four new sync cases.
- Zod AI regression baseline: eight tests failed before the compatibility edits under Zod 4.6.7; all 13 pass after the edits, including against the final dependency graph.
- Both OpenAPI generators: pass; four empty/dangling negative fixtures are rejected. Tracked generated specs are unchanged.
- Full web TypeScript check, ESLint and dashboard/activation i18n parity: pass against the final dependency graph.
- Full web suite: **536 files / 3,082 tests pass** against the frozen final graph. Together with the 12 contracts tests, **3,094 application tests pass**. The same configured maximum of one worker and existing test timeouts are retained.
- Canonical OpenNext build passes: Next production compilation, 411 static pages, standalone traces and the Cloudflare Worker bundle. The build does not deploy or load service credentials.
- The first hosted [CI run](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/45993642012/job/140487473992) passed frozen installation and exposed the Workerd constructor migration above. The old fixture reproduces the same validation failure locally; after the adapter, all five actual Workerd scenarios pass: successful download, redirect rejection, metadata size rejection, streamed size rejection and changed-object rejection. The follow-up changes only this fixture and its evidence; the dependency graph and application code are unchanged.
- Exact-head hosted check results are recorded in the PR validation evidence.

## Release boundary

This change is prepared for the protected draft-PR path. Formal independent review, hosted checks and the separate merge/release authorization remain required before changing the default branch or production. The offline guard prevents reintroducing the observed vulnerable versions while normal dependency maintenance and new-advisory review continue.
