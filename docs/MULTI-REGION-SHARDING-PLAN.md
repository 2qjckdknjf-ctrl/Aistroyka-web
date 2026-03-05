# Multi-region and tenant sharding plan

## Overview

- **Region:** Metadata only (eu | us | me | apac). Used for compliance and routing hints.
- **Shard:** Data plane label (e.g. `default`, `supabase-eu-1`). One shard = one Supabase project today.
- **Routing:** `getDataPlane(tenantId)` returns region, shard, connectionHint. All repository access should resolve data plane by tenant_id; for now connectionHint is always "default" and the app uses the single Supabase client.

## Routing strategy

1. Look up `tenant_data_plane` by tenant_id.
2. If row exists: use region and shard from row. Map shard to connection (today: shard "default" → current Supabase).
3. If no row: use default region "us" and shard "default".
4. Future: when a second Supabase project exists, add a config map (shard → Supabase URL + key) and return connectionHint = shard key; repository factory obtains client by hint.

## Migration strategy

1. Deploy `tenant_data_plane` table; backfill existing tenants with region from `tenant_settings.data_residency` (if set) and shard "default".
2. All tenants remain on default shard until explicit move.
3. New tenants: insert into tenant_data_plane with default or chosen region/shard at provisioning.

## Tenant move strategy (rare)

- Moving a tenant to another shard requires: (1) data migration (export from source, import to target), (2) update tenant_data_plane.shard, (3) switch connection resolution for that tenant. No in-place "move" of live data; planned maintenance window.
- Document in runbook; automate only after second data plane is live.

## Risks and mitigations

- **Risk:** Cross-shard queries (e.g. org-wide analytics). **Mitigation:** Keep org/aggregation reads in app layer by querying each shard and merging, or maintain a read replica/warehouse that aggregates.
- **Risk:** Connection pool per shard. **Mitigation:** Lazy client creation per connectionHint; limit number of shards per process.
- **Risk:** Tenant_data_plane missing for legacy tenant. **Mitigation:** Default to "us" + "default"; backfill on first access optional.
