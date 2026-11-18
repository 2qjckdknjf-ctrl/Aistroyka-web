-- One atomic statement: a quiescent cutover is mandatory because anonymous legacy
-- counters cannot prove which job held a slot. No active claim is guessed or cancelled.
-- Old runtimes fail closed on acquisition and requeue unstarted claims until rollout.
do $migration$
begin
 perform set_config('lock_timeout','5s',true);
 execute 'lock table public.jobs in access exclusive mode';
 perform 1 from public.tenant_concurrency for update;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='jobs' and column_name='slot_locked_at') then
  raise exception 'Slot schema already exists; reconcile migration receipts instead of replay';
 end if;
 if exists(select 1 from public.jobs where status='running' and locked_at>now()-interval '10 minutes') then
  raise exception 'Quiescent slot cutover required: an unexpired running claim exists';
 end if;
 execute $columns$alter table public.jobs add column slot_locked_by text,add column slot_locked_at timestamptz,add column slot_attempts integer,
  add constraint jobs_slot_identity_complete check ((slot_locked_by is null and slot_locked_at is null and slot_attempts is null)
   or (slot_locked_by is not null and slot_locked_at is not null and slot_attempts is not null and slot_attempts>=1))$columns$;
 -- With all job admission locked and no live claim, only expired anonymous debt can remain.
 update public.tenant_concurrency set jobs_running=0,updated_at=now();
 execute $create_client_guard$create or replace function app_private.platform_job_slot_fields_server_only()
returns trigger language plpgsql security invoker set search_path=pg_catalog as $fn$
begin
 if auth.role() is distinct from 'service_role' then
  if tg_op='INSERT' then
   if new.slot_locked_by is not null or new.slot_locked_at is not null or new.slot_attempts is not null then
    raise exception 'Job slots are server-only' using errcode='42501';
   end if;
  elsif new.slot_locked_by is distinct from old.slot_locked_by or new.slot_locked_at is distinct from old.slot_locked_at
    or new.slot_attempts is distinct from old.slot_attempts then
   raise exception 'Job slots are server-only' using errcode='42501';
  end if;
 end if;
 return new;
end; $fn$$create_client_guard$;
 execute $create_lock_tenant$create or replace function app_private.lock_platform_job_slot_tenant(p_tenant_id uuid)
returns void language plpgsql security invoker set search_path=pg_catalog as $fn$
begin
 insert into public.tenant_concurrency(tenant_id,jobs_running,max_jobs_running,updated_at)
 values(p_tenant_id,0,2,now()) on conflict(tenant_id) do nothing;
 perform 1 from public.tenant_concurrency where tenant_id=p_tenant_id for update;
end; $fn$$create_lock_tenant$;
 execute $create_sync_slots$create or replace function app_private.sync_platform_job_slots(p_tenant_id uuid)
returns integer language plpgsql security invoker set search_path=pg_catalog as $fn$
declare n integer;
begin
 -- Caller holds the tenant row before locking any job rows. Lock order is tenant -> jobs.
 update public.jobs set slot_locked_by=null,slot_locked_at=null,slot_attempts=null
 where tenant_id=p_tenant_id and slot_locked_at is not null and (
  status<>'running' or locked_by is distinct from slot_locked_by or locked_at is distinct from slot_locked_at
  or attempts is distinct from slot_attempts or slot_locked_at<=now()-interval '10 minutes');
 select count(*)::integer into n from public.jobs where tenant_id=p_tenant_id and slot_locked_at is not null;
 update public.tenant_concurrency set jobs_running=n,updated_at=now() where tenant_id=p_tenant_id;
 return n;
end; $fn$$create_sync_slots$;
 execute $create_acquire_slot$create or replace function public.acquire_platform_job_slot(p_job_id uuid,p_tenant_id uuid,p_worker_id text,p_locked_at timestamptz,p_attempt integer,p_expected_type text)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
declare j public.jobs%rowtype; occupied integer; cap integer;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service scope required' using errcode='42501'; end if;
 if p_tenant_id is null or p_job_id is null or p_worker_id is null or p_locked_at is null or p_attempt<1 then return false; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and tenant_id=p_tenant_id and status='running' and locked_by=p_worker_id and locked_at=p_locked_at and attempts=p_attempt and type=p_expected_type and locked_at>now()-interval '10 minutes') then return false; end if;
 perform app_private.lock_platform_job_slot_tenant(p_tenant_id);
 select * into j from public.jobs where id=p_job_id and tenant_id=p_tenant_id and status='running' and locked_by=p_worker_id and locked_at=p_locked_at and attempts=p_attempt and type=p_expected_type and locked_at>now()-interval '10 minutes' for update;
 if not found then return false; end if;
 occupied:=app_private.sync_platform_job_slots(p_tenant_id);
 if j.slot_locked_by=p_worker_id and j.slot_locked_at=p_locked_at and j.slot_attempts=p_attempt then return true; end if;
 select max_jobs_running into cap from public.tenant_concurrency where tenant_id=p_tenant_id;
 if occupied>=cap then return false; end if;
 update public.jobs set slot_locked_by=p_worker_id,slot_locked_at=p_locked_at,slot_attempts=p_attempt where id=p_job_id and tenant_id=p_tenant_id;
 perform app_private.sync_platform_job_slots(p_tenant_id);
 return true;
end; $fn$$create_acquire_slot$;
 execute $create_release_slot$create or replace function public.release_platform_job_slot(p_job_id uuid,p_tenant_id uuid,p_worker_id text,p_locked_at timestamptz,p_attempt integer,p_expected_type text)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
declare released integer;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service scope required' using errcode='42501'; end if;
 if p_tenant_id is null or p_job_id is null or not exists(select 1 from public.tenants where id=p_tenant_id) then return false; end if;
 perform app_private.lock_platform_job_slot_tenant(p_tenant_id);
 -- Slot identity survives the core terminal acknowledgement. A late release cannot clear a replacement.
 update public.jobs set slot_locked_by=null,slot_locked_at=null,slot_attempts=null
 where id=p_job_id and tenant_id=p_tenant_id and slot_locked_by=p_worker_id and slot_locked_at=p_locked_at and slot_attempts=p_attempt;
 get diagnostics released=row_count;
 perform app_private.sync_platform_job_slots(p_tenant_id);
 return released=1;
end; $fn$$create_release_slot$;
 execute $create_recover_claim$create or replace function public.recover_expired_platform_job_claim(p_job_id uuid,p_tenant_id uuid,p_worker_id text,p_locked_at timestamptz,p_attempt integer,p_expected_type text)
returns text language plpgsql security definer set search_path=pg_catalog as $fn$
declare j public.jobs%rowtype; outcome text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service scope required' using errcode='42501'; end if;
 if p_expected_type not in ('upload_reconcile','ops_events_prune','retention_cleanup') then return null; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and tenant_id=p_tenant_id and status='running' and locked_by=p_worker_id and locked_at=p_locked_at and attempts=p_attempt and type=p_expected_type and locked_at<now()-interval '10 minutes') then return null; end if;
 perform app_private.lock_platform_job_slot_tenant(p_tenant_id);
 select * into j from public.jobs where id=p_job_id and tenant_id=p_tenant_id and status='running' and locked_by=p_worker_id and locked_at=p_locked_at and attempts=p_attempt and type=p_expected_type and locked_at<now()-interval '10 minutes' for update;
 if not found then return null; end if;
 outcome:=case when j.attempts>=j.max_attempts then 'dead' else 'queued' end;
 update public.jobs set status=outcome,locked_by=null,locked_at=null,updated_at=now(),
  run_after=case when outcome='queued' then now() else run_after end,
  last_error=case when outcome='dead' then 'Expired maintenance attempt budget exhausted' else 'Expired maintenance execution lease' end,
  last_error_type=case when outcome='dead' then 'MAX_ATTEMPTS_EXPIRED' else 'EXPIRED_MAINTENANCE_LEASE' end
 where id=p_job_id and tenant_id=p_tenant_id;
 -- Reclaim leaked capacity in the same transaction, preserving every live lease's slot.
 perform app_private.sync_platform_job_slots(p_tenant_id);
 return outcome;
end; $fn$$create_recover_claim$;
 execute $create_legacy_acquire$create or replace function public.try_acquire_job_slot(p_tenant_id uuid)
returns boolean language sql security invoker set search_path=pg_catalog as $fn$ select false; $fn$$create_legacy_acquire$;
 execute $create_legacy_release$create or replace function public.release_job_slot(p_tenant_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service scope required' using errcode='42501'; end if;
 if not exists(select 1 from public.tenants where id=p_tenant_id) then return; end if;
 perform app_private.lock_platform_job_slot_tenant(p_tenant_id);
 perform app_private.sync_platform_job_slots(p_tenant_id);
end; $fn$$create_legacy_release$;
 execute 'create trigger jobs_slot_fields_server_only before insert or update on public.jobs for each row execute function app_private.platform_job_slot_fields_server_only()';
 execute 'create index idx_jobs_tenant_slot_lease on public.jobs(tenant_id,slot_locked_at) where slot_locked_at is not null';
 execute $index$create index idx_jobs_expired_maintenance on public.jobs(tenant_id,locked_at) where status='running' and type in ('upload_reconcile','ops_events_prune','retention_cleanup')$index$;
 execute 'revoke all on function app_private.platform_job_slot_fields_server_only() from public,anon,authenticated';
 execute 'grant execute on function app_private.platform_job_slot_fields_server_only() to service_role';
 execute 'revoke all on function app_private.lock_platform_job_slot_tenant(uuid) from public,anon,authenticated';
 execute 'grant execute on function app_private.lock_platform_job_slot_tenant(uuid) to service_role';
 execute 'revoke all on function app_private.sync_platform_job_slots(uuid) from public,anon,authenticated';
 execute 'grant execute on function app_private.sync_platform_job_slots(uuid) to service_role';
 execute 'revoke all on function public.acquire_platform_job_slot(uuid,uuid,text,timestamptz,integer,text) from public,anon,authenticated';
 execute 'grant execute on function public.acquire_platform_job_slot(uuid,uuid,text,timestamptz,integer,text) to service_role';
 execute 'revoke all on function public.release_platform_job_slot(uuid,uuid,text,timestamptz,integer,text) from public,anon,authenticated';
 execute 'grant execute on function public.release_platform_job_slot(uuid,uuid,text,timestamptz,integer,text) to service_role';
 execute 'revoke all on function public.recover_expired_platform_job_claim(uuid,uuid,text,timestamptz,integer,text) from public,anon,authenticated';
 execute 'grant execute on function public.recover_expired_platform_job_claim(uuid,uuid,text,timestamptz,integer,text) to service_role';
 execute 'revoke all on function public.try_acquire_job_slot(uuid) from public,anon,authenticated';
 execute 'grant execute on function public.try_acquire_job_slot(uuid) to service_role';
 execute 'revoke all on function public.release_job_slot(uuid) from public,anon,authenticated';
 execute 'grant execute on function public.release_job_slot(uuid) to service_role';
 perform pg_notify('pgrst','reload schema');
end;
$migration$;
