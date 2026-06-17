-- Integração com Google Calendar (OAuth por usuário).
-- Execute no SQL Editor do Supabase depois do schema.sql principal.
-- Segurança: cada usuário só enxerga e altera os próprios tokens (RLS por auth.uid()).

create table if not exists public.google_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  google_email text,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_accounts enable row level security;

-- Leitura apenas do próprio registro.
create policy "google_accounts_select_own"
  on public.google_accounts
  for select
  using (user_id = auth.uid());

-- Inserir/atualizar/remover apenas o próprio registro.
create policy "google_accounts_modify_own"
  on public.google_accounts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Mapeia o evento interno ao evento correspondente no Google, para espelhar edições.
alter table public.calendar_events
  add column if not exists google_event_id text;
