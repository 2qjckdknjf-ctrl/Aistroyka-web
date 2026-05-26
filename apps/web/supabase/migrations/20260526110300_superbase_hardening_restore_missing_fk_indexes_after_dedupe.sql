do $$
declare
  r record;
  idx_name text;
begin
  for r in
    with fk as (
      select
        con.oid as con_oid,
        ns.nspname as schema_name,
        rel.relname as table_name,
        con.conname as fk_name,
        con.conrelid as relid,
        con.conkey as fk_cols,
        string_agg(format('%I', att.attname), ', ' order by ord.n) as col_list
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
      join unnest(con.conkey) with ordinality as ord(attnum, n) on true
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = ord.attnum
      where con.contype = 'f' and ns.nspname = 'public'
      group by con.oid, ns.nspname, rel.relname, con.conname, con.conrelid, con.conkey
    )
    select fk.*
    from fk
    where not exists (
      select 1
      from pg_index idx
      where idx.indrelid = fk.relid
        and idx.indisvalid
        and idx.indpred is null
        and not exists (
          select 1
          from generate_subscripts(fk.fk_cols, 1) s(i)
          where idx.indkey[s.i - 1] <> fk.fk_cols[s.i]
        )
    )
    order by fk.table_name, fk.fk_name
  loop
    idx_name := format('idx_fkfix_%s_%s', left(r.table_name, 28), substr(md5(r.fk_name || ':' || r.table_name), 1, 10));
    execute format(
      'create index if not exists %I on %I.%I (%s)',
      idx_name,
      r.schema_name,
      r.table_name,
      r.col_list
    );
  end loop;
end $$;
