-- Phase 7.7.1 — Remap migration versions (rename-only).
-- Use only when staging/prod has already applied migrations under OLD filenames
-- and you want to record the NEW filenames so the runner does not re-apply.
-- Run with DATABASE_URL or SUPABASE_DB_URL (do not commit credentials).
-- Table: supabase_migrations.schema_migrations (version text primary key).

-- 20260309* → 20260306*
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309600000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306235900') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307000000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306400000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307100000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306410000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307200000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306420000') ON CONFLICT (version) DO NOTHING;

-- 20260307300000 → two migrations (06430000, 06440000)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307300000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306430000') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306440000') ON CONFLICT (version) DO NOTHING;

-- 20260307400000 → two migrations (06450000, 06460000)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307400000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306450000') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306460000') ON CONFLICT (version) DO NOTHING;

-- 20260307500000 → two migrations (06470000, 06480000)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307500000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306470000') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306480000') ON CONFLICT (version) DO NOTHING;

-- 20260307600000 → two migrations (06490000, 06500000)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260307600000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306490000') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306500000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308000000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306510000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308100000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306520000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308200000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306530000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308300000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306540000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308400000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306550000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260308500000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306560000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309000000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306570000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309100000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306580000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309200000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306590000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309300000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306600000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309400000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306610000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309500000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306620000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309550000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306630000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309700000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306640000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309800000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306650000') ON CONFLICT (version) DO NOTHING;

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260309900000';
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260306660000') ON CONFLICT (version) DO NOTHING;
