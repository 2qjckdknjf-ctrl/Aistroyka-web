# Monthly review: database integrity remediation — 27 November 2026

## Status and scope

This change was prepared from `main` at `5eeafe9f777b4479ab7655b5191e3c6e1fe38873` after reviewing GitHub notifications received between 27 October and 27 November 2026 (Europe/Madrid). It repairs still-present findings from merged PRs; a merged feature is not proof that every review comment was resolved.

This document describes proposed code and migrations. No hosted database change, production deployment, main merge, credential change, or paid AI request was performed. Protected main requires a genuine non-author approval. A fresh migration receipt/preflight and the repository's deployment gates remain required before applying anything to the hosted database.

## Confirmed findings and changes

| Source | Confirmed problem on main | Repair |
| --- | --- | --- |
| [PR463](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/463) | Quantity specifications, snapshots and calculation revisions accepted unrelated project or parent IDs through the Supabase Data API. | Bind tenant, project and parent scope in INSERT RLS, bind `created_by` to the caller, and retain valid owner/admin/member writes. |
| [PR463](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/463) | Trigger-only immutability functions were executable as authenticated RPCs. | Revoke PUBLIC/anon/authenticated execution without removing the trigger bindings. |
| [PR469](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/469) | A member could bypass the owner/admin HTTP acceptance gate, spoof the reviewer and permanently occupy an immutable acceptance slot. | Require owner/admin, the actual `auth.uid()`, and a calculation belonging to the same tenant and project. |
| Quantity API parity | Direct snapshot INSERT could bypass the existing HTTP policy for `planned`, `accepted` and `system_complete`. | Members retain only `reported`/`measured` capture; owner/admin retain the other kinds. |
| [PR466](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/466) | Extraction runs and observations could bind foreign projects/drafts/runs and overwrite their original identity or payload. | Bind creation scope, restrict UPDATE column grants to status/review fields, bind reviewer identity, and require newly inserted observations to remain pending. |
| [PR476](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/476) | Direct authenticated correction inserts could forge original snapshots, actor and parent scope. | Remove unused direct client writes. Only the server review operation creates correction provenance. |
| [PR476](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/476) | Updating a prediction before inserting its correction log committed a verdict even when the history write failed; a retry lost the original prediction. | A service-only transaction locks the analysis, snapshots the current prediction, updates the verdict and inserts provenance together. Any constraint, failed insert or silently suppressed row rolls everything back. |
| [PR481](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/481) | Completeness evaluations could refer to another tenant's project. | Enforce project/tenant and creator binding in the database. |
| [PR483](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/483) | Finding-ledger writes could change source identity and bypass project scope. Suspended or closed accounts retained ledger access. | Limit review UPDATE columns, enforce project and reviewer binding, require new findings to await review, prevent revising terminal decisions, and use the existing private account-active guard for SELECT/INSERT/UPDATE. |
| Review migration prerequisite | The hosted schema already has `ai_analysis.tenant_id`, its restrictive FK and a source-derived trigger, but the repository lacked the column prerequisite for the October review index. | Add a previously missing prerequisite migration before that index; derive only missing values from media, preserve explicit existing values and fail on inconsistent or missing source ownership. Reject new source/tenant mismatches. |

The review transaction preserves the current application cohort: `canManageTasks` delegates to `canManageProjects`, which permits owner/admin/member. It does not silently restrict valid member reviews. Quantity **acceptance** remains separately owner/admin-only. The service transaction also checks that the reviewer's tenant account is active; using a service client must not bypass the parent analysis suspension boundary.

## Transaction and error behavior

`review_ai_analysis_atomic` is callable only by the service role. It checks the supplied reviewer against the tenant, locks the analysis row with `FOR UPDATE`, then obtains the original snapshot and review timestamp. Two concurrent edits therefore record the real preceding prediction, rather than both copying stale state. The server passes only supported prediction fields; the SQL boundary applies its own limits and ignores unknown fields.

The RPC returns a receipt including the correction ID. The service validates the receipt before returning success, normalizes UUID case, maps missing/unauthorized/invalid requests to the existing error contract, and does not expose raw database errors containing prediction data. Graph invalidation occurs only after a successful non-eligible verdict and remains best effort, preserving the prior application contract.

Column grants intentionally protect the original run, observation and finding provenance. A subsequent review changes review state or labels; it does not rewrite extraction payload, source coordinates, tenant, run, project or creator.

## Verification

- The initial isolated PostgreSQL reproduction against the old migrations produced **32 failing / 8 passing** checks. These were actual authorization and SQL effects, including the missing column prerequisite, rather than string-pattern tests.
- The expanded harness passes **87/87** PGlite PostgreSQL contracts after the repairs. Coverage includes valid writes, foreign parent IDs, caller spoofing, member acceptance, account suspension/closure, column privileges, RPC grants, failed and silently suppressed inserts, exact original snapshots, retry behavior and migration idempotence.
- Native PostgreSQL CI runs the same contracts in an empty local database, then adds two independent-connection races: first reviewer commits, and first reviewer rolls back. The second must wait for the row lock and snapshot the actual surviving prediction.
- Application tests cover the single-RPC contract, payload limits, receipt validation, errors and graph invalidation. Exact final counts and hosted CI receipts are recorded in the pull request after completion.
- CI uses fixed test-runtime packages with `--no-audit`; no private dependency inventory is sent to an audit endpoint.

The isolated harness loads the affected historical migrations and their actual helper bodies on a minimal schema. It is not a claim that every historical repository migration has been replayed against production. Native PostgreSQL execution and the final full application/build checks must be verified on the published PR head.

## Applying safely after review

The new prerequisite is `20261028130000_ai_analysis_tenant_binding.sql`; the authorization repair is `20261127150000_harden_internal_review_integrity.sql`; the RPC is `20261127151000_review_ai_analysis_atomic.sql`. Their source ordering is intentional and no previously applied migration was edited. An existing hosted database needs explicit receipt/preflight reconciliation for the newly represented historical prerequisite. Do not run a blind `db push`, alter migration history to make a gate green, or deploy the RPC-dependent service before the reviewed database migration is available.

Read-only hosted metadata confirmed the existing `tenant_id NOT NULL`, its `ON DELETE RESTRICT` FK and source-derived trigger, and the permissive policies being repaired. No customer rows were rewritten or existing provenance claimed to have been repaired. Any older malformed associations need a separately reviewed data repair based on actual row-level evidence; the new policies stop creation of new invalid associations.

This package is independent of the dependency remediation, caption replacement and quantity/preproject transaction packages from the same monthly audit. All proposed changes still require normal review and the relevant deployment gates; passing CI alone is not a claim of production activation.
