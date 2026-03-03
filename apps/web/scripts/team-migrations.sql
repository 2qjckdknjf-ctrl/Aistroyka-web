-- Команда и приглашения: выполните этот файл в Supabase → SQL Editor → New query.
-- Требуется: таблица public.tenants уже должна существовать (основные миграции применены).

-- 1) Связь tenant с пользователем (владелец кабинета)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_user_id
  ON public.tenants(user_id)
  WHERE user_id IS NOT NULL;

-- 2) Участники кабинета и роли
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for tenant_members" ON public.tenant_members;
CREATE POLICY "Allow all for tenant_members" ON public.tenant_members FOR ALL USING (true) WITH CHECK (true);

-- Владельцы: для существующих tenant с user_id добавляем запись в tenant_members
INSERT INTO public.tenant_members (tenant_id, user_id, role)
  SELECT id, user_id, 'owner' FROM public.tenants WHERE user_id IS NOT NULL
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';

-- 3) Приглашения по email
CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_invitations_token ON public.tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id ON public.tenant_invitations(tenant_id);
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for tenant_invitations" ON public.tenant_invitations;
CREATE POLICY "Allow all for tenant_invitations" ON public.tenant_invitations FOR ALL USING (true) WITH CHECK (true);
