# Push notifications

## Overview

- **device_tokens:** (tenant_id, user_id, device_id, platform ios|android, token). Register via POST /api/v1/devices/register; unregister via POST /api/v1/devices/unregister.
- **push_outbox:** Messages to send (tenant_id, user_id, platform, type job_done|report_ready|task_assigned, payload, status queued|sent|failed). Worker/job processes outbox and calls APNs or FCM.

## When credentials not present

- Outbox and enqueue are implemented. Send is stubbed: APNs/FCM stubs return false when credentials are not configured. Document clearly; implement send when APNS_* or FCM_* (or GOOGLE_APPLICATION_CREDENTIALS) are set.

## Admin

- POST /api/v1/admin/push/test enqueues a test push (admin only). Useful to verify outbox and (when implemented) delivery.
