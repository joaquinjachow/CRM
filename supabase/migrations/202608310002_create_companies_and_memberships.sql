create schema if not exists private;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  owner_user_id uuid not null unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null check (char_length(btrim(email)) between 3 and 320),
  role text not null check (role in ('owner', 'admin', 'operator', 'viewer', 'custom')),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists company_memberships_company_id_idx on public.company_memberships(company_id);

create table if not exists public.company_crm_state (
  company_id uuid primary key references public.companies(id) on delete cascade,
  state jsonb not null default '{"stock":[],"pedidos":[],"presupuestos":[],"ingresos":[],"facturas":[],"equipment":[],"reminders":[],"cashOpeningBalance":0,"cashMovements":[],"cheques":[],"monthlyPaymentNotices":[],"monthlyPayments":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  freight_cost_per_km numeric not null default 0 check (freight_cost_per_km >= 0),
  updated_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function private.set_updated_at();

drop trigger if exists company_memberships_set_updated_at on public.company_memberships;
create trigger company_memberships_set_updated_at
before update on public.company_memberships
for each row execute function private.set_updated_at();

drop trigger if exists company_settings_set_updated_at on public.company_settings;
create trigger company_settings_set_updated_at
before update on public.company_settings
for each row execute function private.set_updated_at();

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships as membership
    where membership.company_id = target_company_id
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_company_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_company_member(uuid) to authenticated;

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_crm_state enable row level security;
alter table public.company_settings enable row level security;

drop policy if exists "Members can read their company" on public.companies;
create policy "Members can read their company"
  on public.companies for select to authenticated
  using (private.is_company_member(id));

drop policy if exists "Members can read company memberships" on public.company_memberships;
create policy "Members can read company memberships"
  on public.company_memberships for select to authenticated
  using (private.is_company_member(company_id));

drop policy if exists "Members can read their company state" on public.company_crm_state;
create policy "Members can read their company state"
  on public.company_crm_state for select to authenticated
  using (private.is_company_member(company_id));

drop policy if exists "Members can read company settings" on public.company_settings;
create policy "Members can read company settings"
  on public.company_settings for select to authenticated
  using (private.is_company_member(company_id));

revoke all on table public.companies from anon, authenticated;
revoke all on table public.company_memberships from anon, authenticated;
revoke all on table public.company_crm_state from anon, authenticated;
revoke all on table public.company_settings from anon, authenticated;
