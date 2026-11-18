-- Persist optional on-device location evidence when a worker starts the day.
-- Nullable so empty-body clients keep working.

alter table public.worker_day
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists accuracy_m double precision;

alter table public.worker_day
  drop constraint if exists worker_day_latitude_range;
alter table public.worker_day
  add constraint worker_day_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.worker_day
  drop constraint if exists worker_day_longitude_range;
alter table public.worker_day
  add constraint worker_day_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.worker_day
  drop constraint if exists worker_day_accuracy_nonnegative;
alter table public.worker_day
  add constraint worker_day_accuracy_nonnegative
  check (accuracy_m is null or accuracy_m >= 0);
