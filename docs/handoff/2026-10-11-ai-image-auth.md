# Image authorization continuation

Source: fix/ai-image-auth-2026-10-11 from e03cb5a. See the focused hard audit and task file for scope and local evidence.

Next: required CI plus independent current-head review, protected merge, staging-first deploy, anonymous/role negatives and authenticated strict live-provider verification on both hosts. Then repair the legacy global-dequeue path identified in #200; do not close #200 before that second gap is addressed. No DB migration is needed for the image entry-point fix. Full roadmap completion is not claimed.
