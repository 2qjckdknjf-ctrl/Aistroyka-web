# Notifications Module (Phase 3)

**Date:** 2026-03-07  
**Scope:** Replace notifications placeholder with real or readiness surface.

## Summary

- **Backend:** GET /api/v1/devices returns device list (tenant-scoped; no push tokens). Uses getAdminClient() ?? createClient() — may require admin or cookie auth in some deployments; no dedicated notifications inbox endpoint.
- **iOS:** NotificationsView (More → Notifications) calls ManagerAPI.devices(limit: 100). On success shows "Registered devices" list (device_id, platform, created_at). On error shows empty state: "No notification inbox is available yet" and error hint. Pull-to-refresh, loading state.
- **Manager vs worker:** Manager shows device list (cockpit); Worker registers device via POST /api/v1/devices/register. Semantics stay separate; no notifications list API yet — documented in PHASE3_BACKEND_GAPS.
