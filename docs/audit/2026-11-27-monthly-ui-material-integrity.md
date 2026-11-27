# Monthly review follow-up: manager UI and material integrity

Date: 2026-11-27. Base: `5eeafe9f777b4479ab7655b5191e3c6e1fe38873`.

This patch follows the monthly GitHub mail review. Each old review finding was
checked against current source before editing. It repairs existing manager
workflows; it does not add a procurement, approval, or autonomous execution flow.

## Confirmed defects and repairs

| Original review | Defect present on the base | Repair |
| --- | --- | --- |
| PR486, AIS-RULE-015 | Checklist requirements/questions leaked English; an edited checklist or changed project could retain an obsolete evaluation. | Localize the known checklist vocabulary in en/ru/es/it; clear results on input change and accept only the current input revision's success/error. |
| PR485, AIS-RECON-017 | Blank numeric fields became zero; finding kinds/statuses leaked raw identifiers; failed reviews were silent. | Require nonblank fields while preserving explicit zero, localize known values, show a review error and invalidate the ledger after settlement. The message does not claim that a refetch succeeded. |
| PR481 | Recommended conflicts did not force review; duplicate inventory order could conceal a conflict. | Any conflicting evidence requires review; resolve duplicate inventory conservatively and deterministically. |
| PR479 | An explicit quote selection could silently lose unavailable, foreign-project, or foreign-draft IDs. | Validate and preserve the entire selected set. Canonicalize UUID case before deduplication and receipt matching. |
| PR473, AIS-MATERIAL-008 | Invalid arithmetic could occupy an immutable material draft's unique acceptance slot; invalid lead times were truncated/erased or failed in SQL. | Reject fatal calculation issues before insertion. Validate integer lead time and preserve intentional missing optional material parameters. |
| PR470 | A valid acceptance could authorize a different submitted commercial quantity. | Bind quantity, unit, basis, purpose, component and request identity to its scoped immutable calculation and input snapshot. |
| PR471 follow-up | Recomputing the identical calculation cleared its existing acceptance and downstream local results. | Keep those results when the returned calculation ID is unchanged; clear them for a new calculation. |
| PR487 | A successfully consumed intake draft remained selected in the extraction form. | Clear the selection after success. |
| Independent review | Material drafts had the same accepted-quantity substitution gap; malformed JSON and supplied non-string decimals could become incomplete immutable drafts. | Check the accepted calculation's scoped, exact normalized quantity before insert; reject malformed bodies and supplied invalid decimal types at HTTP and service boundaries. |

The historical PR464 `CanonSurface` missing-prop defect is already fixed on the
base and is not attributed to this patch. Intake persistence and SQL integrity
are handled in a separate additive-migration patch.

## Verification evidence

- Initial UI/completeness/material regression batch: 34 failures and 13 passes
  before the fixes; 47 passes after them.
- The final material identity and JSON-type regression batch: 13 failures and
  45 passes before its repair; 58 passes after it. Existing material tests also
  pass (66 material tests together).
- Independent source review and seven focused suites: 113 tests passed,
  including real DOM/query/fetch lifecycle checks, all four locale bundles,
  immutable-set selection and exact-decimal identity checks.
- This branch is isolated directly from the recorded base. Its own complete
  test suite, TypeScript, ESLint and locale parity checks are required before
  publication; exact-head GitHub CI results are recorded in the PR.

No production data was changed. Existing immutable records are not rewritten by
these validators. The PR remains a draft until the repository's review and
release gates are satisfied.
