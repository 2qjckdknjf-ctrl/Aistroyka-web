# Hosted apply — ai_analysis human review — 2026-10-28

## Scope

Apply SQL from PR #458 `ai_analysis_human_review` to active project AISTROYKA `vthfrxehrursfloevnlp`.

## Applied

| Repo file | Remote name | Remote version |
|---|---|---|
| `20261028140000_ai_analysis_human_review.sql` | `ai_analysis_human_review` | `20261028124223` |

## Verification

Columns on `public.ai_analysis`:

- `review_status` text NOT NULL default `'pending'`
- `reviewed_at` timestamptz nullable
- `reviewed_by` uuid nullable
- `review_note` text nullable

## Verdict

**YES** for hosted apply. Live Worker upload→result→retry→review scenario remains separate evidence.
