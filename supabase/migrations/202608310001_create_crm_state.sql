create table if not exists public.crm_state (
  id text primary key check (id = 'main'),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.crm_state enable row level security;
