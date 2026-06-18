-- Cor do evento na agenda (apenas visual no app; não vai para o Google).
-- Execute no SQL Editor do Supabase. Valores: 'neutral' | 'red' | 'yellow'.

alter table public.calendar_events
  add column if not exists color text not null default 'neutral';
