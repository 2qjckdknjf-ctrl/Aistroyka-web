-- Explicit human review gate for durable vision results before Graph promotion.
-- Pending results remain contractor-internal evidence candidates, not proven Graph facts.
-- Preserve existing session/platform insert paths; default keeps new rows pending.

alter table public.ai_analysis
  add column if not exists review_status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists review_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_analysis_review_status_check'
      and conrelid = 'public.ai_analysis'::regclass
  ) then
    alter table public.ai_analysis
      add constraint ai_analysis_review_status_check
      check (review_status = any (array[
        'pending'::text,
        'accepted'::text,
        'rejected'::text,
        'insufficient_evidence'::text
      ]));
  end if;
end;
$$;

comment on column public.ai_analysis.review_status is
  'Human review of durable vision result; only accepted may promote into Graph lineage.';
comment on column public.ai_analysis.reviewed_at is
  'When a manager/admin recorded the review verdict.';
comment on column public.ai_analysis.reviewed_by is
  'Auth user who recorded the review verdict.';
comment on column public.ai_analysis.review_note is
  'Optional reviewer reason; never customer-facing.';

create index if not exists ai_analysis_review_status_idx
  on public.ai_analysis (tenant_id, review_status, created_at desc);
