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
        con.conkey as fk_cols,
        rel.oid as relid,
        string_agg(format('%I', att.attname), ', ' order by ord.n) as col_list
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
      join unnest(con.conkey) with ordinality as ord(attnum, n) on true
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = ord.attnum
      where con.contype = 'f'
        and ns.nspname = 'public'
      group by con.oid, ns.nspname, rel.relname, con.conname, con.conkey, rel.oid
    ), covered as (
      select distinct fk.con_oid
      from fk
      join pg_index idx on idx.indrelid = fk.relid
      where idx.indisvalid
        and idx.indpred is null
        and (idx.indkey::smallint[])[1:cardinality(fk.fk_cols)] = fk.fk_cols
    )
    select fk.*
    from fk
    left join covered c on c.con_oid = fk.con_oid
    where c.con_oid is null
    order by fk.table_name, fk.fk_name
  loop
    idx_name := format('idx_%s_%s_fk', left(r.table_name, 35), substr(md5(r.fk_name || ':' || r.table_name), 1, 8));
    execute format(
      'create index if not exists %I on %I.%I (%s)',
      idx_name,
      r.schema_name,
      r.table_name,
      r.col_list
    );
  end loop;
end $$;
