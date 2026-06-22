# Expert Review Queue Data Model

**Migration:** `20260617160000_ai_expert_review_queue.sql`

## New table: `ai_expert_review_queue`

Pending candidates with scrubbed JSON. RLS deny-all (service-role only).

## Existing table: `ai_expert_reviews`

Completed expert reviews (unchanged). Submission writes here on review complete.

## Why both

`ai_expert_reviews` has no queue status — separate queue table tracks pending → completed/skipped lifecycle.
