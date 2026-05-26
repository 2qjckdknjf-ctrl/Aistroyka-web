do $$
declare
  r record;
begin
  -- Find tables where anon/public has multiple permissive policies
  -- for the same command, then scope those policies to authenticated.
  for r in
    with noisy as (
      select tablename
      from pg_policies
      where schemaname = 'public'
        and permissive = 'PERMISSIVE'
        and 'public' = any(roles)
      group by tablename, cmd
      having count(*) > 1
    )
    select p.schemaname, p.tablename, p.policyname
    from pg_policies p
    join noisy n on n.tablename = p.tablename
    where p.schemaname = 'public'
      and p.permissive = 'PERMISSIVE'
      and 'public' = any(p.roles)
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  end loop;
end $$;
