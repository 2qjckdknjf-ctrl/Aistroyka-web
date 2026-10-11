# Customer intake contract refresh — 2026-10-11

Resume existing PR #410; no duplicate implementation. Update its runbook and endpoint index after #406/#411: sole active tenant fallback, project query hints, withdraw transition, creator/RLS checks and Customer iOS paths.

Runtime observation: staging and production health HTTP 200, buildStamp.sha7=813c6ae; #411 is published. DB apply still OWNER_GATE because staging client targets production AISTROYKA project. No DB writes.

Validation: compare runbook to current routes/service/resolver and Swift paths; existing portal and domain regression tests. Plain macOS Swift tests cannot load UIKit; use simulator CI for iOS evidence.
