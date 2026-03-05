# ADR-055: Single data plane (default only)

**Status:** Accepted  
**Decision:** Only one data plane exists; getDataPlane always returns connectionHint "default". tenant_data_plane rows optional; missing implies default. No second Supabase project yet.
