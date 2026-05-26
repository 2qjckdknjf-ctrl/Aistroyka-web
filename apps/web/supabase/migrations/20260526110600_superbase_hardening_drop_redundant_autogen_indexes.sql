do $$
declare
  r record;
  has_equivalent boolean;
begin
  for r in
    select
      idx.indexrelid,
      cls_idx.relname as index_name,
      idx.indrelid,
      idx.indkey::smallint[] as indkey_arr,
      ns_tbl.nspname as schema_name,
      cls_tbl.relname as table_name
    from pg_index idx
    join pg_class cls_idx on cls_idx.oid = idx.indexrelid
    join pg_class cls_tbl on cls_tbl.oid = idx.indrelid
    join pg_namespace ns_tbl on ns_tbl.oid = cls_tbl.relnamespace
    where ns_tbl.nspname = 'public'
      and idx.indisvalid
      and idx.indpred is null
      and (
        cls_idx.relname ~ '^idx_.*_[0-9a-f]{8}_fk$'
        or cls_idx.relname ~ '^idx_fkfix_'
      )
  loop
    select exists (
      select 1
      from pg_index i2
      join pg_class c2 on c2.oid = i2.indexrelid
      where i2.indrelid = r.indrelid
        and i2.indisvalid
        and i2.indpred is null
        and i2.indexrelid <> r.indexrelid
        and not exists (
          select 1
          from generate_subscripts(r.indkey_arr, 1) s(i)
          where i2.indkey[s.i - 1] <> r.indkey_arr[s.i]
        )
    )
    into has_equivalent;

    if has_equivalent then
      execute format('drop index if exists %I.%I', r.schema_name, r.index_name);
    end if;
  end loop;
end $$;
