do $$
declare
  r record;
  new_qual text;
  new_with_check text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.jwt()%'
        or coalesce(with_check, '') like '%auth.jwt()%'
      )
  loop
    new_qual := case
      when r.qual is null then null
      else replace(r.qual, 'auth.jwt()', '(select auth.jwt())')
    end;

    new_with_check := case
      when r.with_check is null then null
      else replace(r.with_check, 'auth.jwt()', '(select auth.jwt())')
    end;

    if new_qual is distinct from r.qual or new_with_check is distinct from r.with_check then
      if new_qual is not null and new_with_check is not null then
        execute format(
          'alter policy %I on %I.%I using (%s) with check (%s)',
          r.policyname,
          r.schemaname,
          r.tablename,
          new_qual,
          new_with_check
        );
      elsif new_qual is not null then
        execute format(
          'alter policy %I on %I.%I using (%s)',
          r.policyname,
          r.schemaname,
          r.tablename,
          new_qual
        );
      elsif new_with_check is not null then
        execute format(
          'alter policy %I on %I.%I with check (%s)',
          r.policyname,
          r.schemaname,
          r.tablename,
          new_with_check
        );
      end if;
    end if;
  end loop;
end $$;
