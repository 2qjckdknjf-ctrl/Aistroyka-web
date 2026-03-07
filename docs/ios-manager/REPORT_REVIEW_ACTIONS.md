# Report Review Actions (Phase 3)

**Date:** 2026-03-07  
**Scope:** Manager report detail from read-only toward actionable review.

## Summary

- **Backend audit:** No manager-facing report state-change endpoints found (no approve, mark reviewed, request changes, escalate, or manager note). Report lifecycle is draft → submitted via worker; no write for manager review state.
- **iOS:** ReportDetailReviewView has a "Review actions" section with explanatory text: "Approve / Mark reviewed / Request changes" and "Backend does not yet expose report review write endpoints. Actions will be enabled when available."
- **No fake persistence:** No buttons that pretend to persist; shell only until backend supports it.
- **Contract needed:** See PHASE3_BACKEND_GAPS.md for minimal endpoint proposal.
