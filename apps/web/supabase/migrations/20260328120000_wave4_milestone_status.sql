-- Wave 4 Step 1: explicit milestone lifecycle (planned / in_progress / completed / delayed / archived)

alter table public.project_milestones drop constraint if exists project_milestones_status_check;

update public.project_milestones set status = 'planned' where status = 'pending';
update public.project_milestones set status = 'completed' where status = 'done';
update public.project_milestones set status = 'archived' where status = 'cancelled';

alter table public.project_milestones
  add constraint project_milestones_status_check
  check (status in ('planned', 'in_progress', 'completed', 'delayed', 'archived'));

alter table public.project_milestones alter column status set default 'planned';

comment on column public.project_milestones.status is 'planned | in_progress | completed | delayed | archived';
