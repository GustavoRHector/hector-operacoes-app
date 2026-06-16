-- Execute este arquivo no SQL Editor do Supabase antes de usar a aplicação.
-- Segurança em primeiro lugar: todas as tabelas operacionais usam RLS por empresa.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'manager', 'member');
create type public.task_status as enum ('todo', 'doing', 'waiting', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.recurring_status as enum ('ok', 'due_soon', 'expired', 'renewing', 'renewed');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  city text,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.processes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  category text not null,
  status text not null default 'Aberto',
  due_date date,
  responsible_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_pendings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  category text not null,
  document_number text,
  issued_at date,
  due_date date not null,
  status public.recurring_status not null default 'ok',
  responsible_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  position integer not null default 0
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recurring_pending_id uuid references public.recurring_pendings(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  done_at timestamptz,
  position integer not null default 0
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  event_type text not null default 'Compromisso',
  responsible_id uuid references public.profiles(id) on delete set null,
  process_id uuid references public.processes(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  recurring_pending_id uuid references public.recurring_pendings(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_valid_period check (ends_at is null or ends_at >= starts_at)
);

create index tasks_company_due_date_idx on public.tasks (company_id, due_date);
create index processes_company_due_date_idx on public.processes (company_id, due_date);
create index recurring_pendings_company_due_date_idx on public.recurring_pendings (company_id, due_date);
create index calendar_events_company_starts_at_idx on public.calendar_events (company_id, starts_at);
create index checklist_items_company_pending_idx on public.checklist_items (company_id, recurring_pending_id);

-- Retorna a empresa do usuário logado para as políticas RLS.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Retorna o perfil de acesso do usuário logado para regras futuras.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Confere se o usuário atual pode alterar cadastros operacionais da empresa.
create or replace function public.can_manage_company()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'manager')
$$;

-- Atualiza o campo updated_at sempre que um registro operacional é alterado.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Confere se um perfil informado pertence à mesma empresa do registro.
create or replace function public.assert_profile_same_company(target_profile_id uuid, target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_profile_id is null
    or exists (
      select 1
      from public.profiles
      where id = target_profile_id
        and company_id = target_company_id
    )
$$;

-- Confere se uma unidade informada pertence à mesma empresa do registro.
create or replace function public.assert_unit_same_company(target_unit_id uuid, target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_unit_id is null
    or exists (
      select 1
      from public.units
      where id = target_unit_id
        and company_id = target_company_id
    )
$$;

-- Confere se uma pendência informada pertence à mesma empresa do registro.
create or replace function public.assert_pending_same_company(target_pending_id uuid, target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_pending_id is null
    or exists (
      select 1
      from public.recurring_pendings
      where id = target_pending_id
        and company_id = target_company_id
    )
$$;

-- Confere se uma tarefa informada pertence à mesma empresa do registro.
create or replace function public.assert_task_same_company(target_task_id uuid, target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_task_id is null
    or exists (
      select 1
      from public.tasks
      where id = target_task_id
        and company_id = target_company_id
    )
$$;

-- Confere se um processo informado pertence à mesma empresa do registro.
create or replace function public.assert_process_same_company(target_process_id uuid, target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_process_id is null
    or exists (
      select 1
      from public.processes
      where id = target_process_id
        and company_id = target_company_id
    )
$$;

-- Bloqueia tarefas com responsável ou criador de outra empresa.
create or replace function public.validate_task_company_refs()
returns trigger
language plpgsql
as $$
begin
  if not public.assert_profile_same_company(new.assignee_id, new.company_id) then
    raise exception 'assignee_id pertence a outra empresa';
  end if;

  if not public.assert_profile_same_company(new.created_by, new.company_id) then
    raise exception 'created_by pertence a outra empresa';
  end if;

  return new;
end;
$$;

-- Impede usuário comum de alterar campos sensíveis da tarefa por API direta.
create or replace function public.validate_task_update_scope()
returns trigger
language plpgsql
as $$
begin
  if public.can_manage_company() then
    return new;
  end if;

  if old.company_id is distinct from new.company_id
    or old.title is distinct from new.title
    or old.description is distinct from new.description
    or old.priority is distinct from new.priority
    or old.due_date is distinct from new.due_date
    or old.assignee_id is distinct from new.assignee_id
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'usuário comum só pode alterar status da tarefa';
  end if;

  return new;
end;
$$;

-- Bloqueia processos com responsável de outra empresa.
create or replace function public.validate_process_company_refs()
returns trigger
language plpgsql
as $$
begin
  if not public.assert_profile_same_company(new.responsible_id, new.company_id) then
    raise exception 'responsible_id pertence a outra empresa';
  end if;

  return new;
end;
$$;

-- Bloqueia pendências com unidade ou responsável de outra empresa.
create or replace function public.validate_recurring_pending_company_refs()
returns trigger
language plpgsql
as $$
begin
  if not public.assert_unit_same_company(new.unit_id, new.company_id) then
    raise exception 'unit_id pertence a outra empresa';
  end if;

  if not public.assert_profile_same_company(new.responsible_id, new.company_id) then
    raise exception 'responsible_id pertence a outra empresa';
  end if;

  return new;
end;
$$;

-- Bloqueia checklist vinculado a tarefa ou pendência de outra empresa.
create or replace function public.validate_checklist_item_company_refs()
returns trigger
language plpgsql
as $$
begin
  if not public.assert_pending_same_company(new.recurring_pending_id, new.company_id) then
    raise exception 'recurring_pending_id pertence a outra empresa';
  end if;

  if not public.assert_task_same_company(new.task_id, new.company_id) then
    raise exception 'task_id pertence a outra empresa';
  end if;

  return new;
end;
$$;

-- Bloqueia agenda vinculada a registros de outra empresa.
create or replace function public.validate_calendar_event_company_refs()
returns trigger
language plpgsql
as $$
begin
  if not public.assert_profile_same_company(new.responsible_id, new.company_id) then
    raise exception 'responsible_id pertence a outra empresa';
  end if;

  if not public.assert_profile_same_company(new.created_by, new.company_id) then
    raise exception 'created_by pertence a outra empresa';
  end if;

  if not public.assert_process_same_company(new.process_id, new.company_id) then
    raise exception 'process_id pertence a outra empresa';
  end if;

  if not public.assert_task_same_company(new.task_id, new.company_id) then
    raise exception 'task_id pertence a outra empresa';
  end if;

  if not public.assert_pending_same_company(new.recurring_pending_id, new.company_id) then
    raise exception 'recurring_pending_id pertence a outra empresa';
  end if;

  return new;
end;
$$;

-- Impede usuário comum de alterar campos sensíveis da agenda por API direta.
create or replace function public.validate_calendar_event_update_scope()
returns trigger
language plpgsql
as $$
begin
  if public.can_manage_company() then
    return new;
  end if;

  if old.company_id is distinct from new.company_id
    or old.responsible_id is distinct from new.responsible_id
    or old.process_id is distinct from new.process_id
    or old.task_id is distinct from new.task_id
    or old.recurring_pending_id is distinct from new.recurring_pending_id
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'usuário comum não pode alterar vínculos sensíveis da agenda';
  end if;

  return new;
end;
$$;

create trigger tasks_touch_updated_at
before update on public.tasks
for each row execute function public.touch_updated_at();

create trigger tasks_validate_company_refs
before insert or update on public.tasks
for each row execute function public.validate_task_company_refs();

create trigger tasks_validate_update_scope
before update on public.tasks
for each row execute function public.validate_task_update_scope();

create trigger processes_touch_updated_at
before update on public.processes
for each row execute function public.touch_updated_at();

create trigger processes_validate_company_refs
before insert or update on public.processes
for each row execute function public.validate_process_company_refs();

create trigger recurring_pendings_touch_updated_at
before update on public.recurring_pendings
for each row execute function public.touch_updated_at();

create trigger recurring_pendings_validate_company_refs
before insert or update on public.recurring_pendings
for each row execute function public.validate_recurring_pending_company_refs();

create trigger checklist_items_validate_company_refs
before insert or update on public.checklist_items
for each row execute function public.validate_checklist_item_company_refs();

create trigger calendar_events_touch_updated_at
before update on public.calendar_events
for each row execute function public.touch_updated_at();

create trigger calendar_events_validate_company_refs
before insert or update on public.calendar_events
for each row execute function public.validate_calendar_event_company_refs();

create trigger calendar_events_validate_update_scope
before update on public.calendar_events
for each row execute function public.validate_calendar_event_update_scope();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.tasks enable row level security;
alter table public.processes enable row level security;
alter table public.recurring_pendings enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.checklist_items enable row level security;
alter table public.calendar_events enable row level security;

create policy "profiles_select_same_company"
on public.profiles for select
to authenticated
using (company_id = public.current_company_id());

create policy "companies_select_own"
on public.companies for select
to authenticated
using (id = public.current_company_id());

create policy "units_select_same_company"
on public.units for select
to authenticated
using (company_id = public.current_company_id());

create policy "units_manage_same_company"
on public.units for all
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company())
with check (company_id = public.current_company_id() and public.can_manage_company());

create policy "tasks_select_same_company"
on public.tasks for select
to authenticated
using (company_id = public.current_company_id());

create policy "tasks_insert_same_company"
on public.tasks for insert
to authenticated
with check (
  company_id = public.current_company_id()
  and created_by = auth.uid()
);

create policy "tasks_update_responsible_or_manager"
on public.tasks for update
to authenticated
using (
  company_id = public.current_company_id()
  and (
    public.can_manage_company()
    or assignee_id = auth.uid()
    or created_by = auth.uid()
  )
)
with check (
  company_id = public.current_company_id()
  and (
    public.can_manage_company()
    or assignee_id = auth.uid()
    or created_by = auth.uid()
  )
);

create policy "tasks_delete_manager_only"
on public.tasks for delete
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company());

create policy "processes_select_same_company"
on public.processes for select
to authenticated
using (company_id = public.current_company_id());

create policy "processes_manage_same_company"
on public.processes for all
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company())
with check (company_id = public.current_company_id() and public.can_manage_company());

create policy "recurring_pendings_select_same_company"
on public.recurring_pendings for select
to authenticated
using (company_id = public.current_company_id());

create policy "recurring_pendings_manage_same_company"
on public.recurring_pendings for all
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company())
with check (company_id = public.current_company_id() and public.can_manage_company());

create policy "checklist_templates_select_same_company"
on public.checklist_templates for select
to authenticated
using (company_id = public.current_company_id());

create policy "checklist_templates_manage_same_company"
on public.checklist_templates for all
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company())
with check (company_id = public.current_company_id() and public.can_manage_company());

create policy "checklist_template_items_same_company_select"
on public.checklist_template_items for select
to authenticated
using (
  exists (
    select 1
    from public.checklist_templates templates
    where templates.id = checklist_template_items.template_id
      and templates.company_id = public.current_company_id()
  )
);

create policy "checklist_template_items_same_company_insert"
on public.checklist_template_items for insert
to authenticated
with check (
  public.can_manage_company()
  and
  exists (
    select 1
    from public.checklist_templates templates
    where templates.id = checklist_template_items.template_id
      and templates.company_id = public.current_company_id()
  )
);

create policy "checklist_template_items_same_company_update"
on public.checklist_template_items for update
to authenticated
using (
  public.can_manage_company()
  and
  exists (
    select 1
    from public.checklist_templates templates
    where templates.id = checklist_template_items.template_id
      and templates.company_id = public.current_company_id()
  )
)
with check (
  public.can_manage_company()
  and
  exists (
    select 1
    from public.checklist_templates templates
    where templates.id = checklist_template_items.template_id
      and templates.company_id = public.current_company_id()
  )
);

create policy "checklist_template_items_same_company_delete"
on public.checklist_template_items for delete
to authenticated
using (
  public.can_manage_company()
  and
  exists (
    select 1
    from public.checklist_templates templates
    where templates.id = checklist_template_items.template_id
      and templates.company_id = public.current_company_id()
  )
);

create policy "checklist_items_select_same_company"
on public.checklist_items for select
to authenticated
using (company_id = public.current_company_id());

create policy "checklist_items_manage_same_company"
on public.checklist_items for all
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company())
with check (company_id = public.current_company_id() and public.can_manage_company());

create policy "calendar_events_select_same_company"
on public.calendar_events for select
to authenticated
using (company_id = public.current_company_id());

create policy "calendar_events_insert_same_company"
on public.calendar_events for insert
to authenticated
with check (
  company_id = public.current_company_id()
  and created_by = auth.uid()
);

create policy "calendar_events_update_responsible_or_manager"
on public.calendar_events for update
to authenticated
using (
  company_id = public.current_company_id()
  and (
    public.can_manage_company()
    or responsible_id = auth.uid()
    or created_by = auth.uid()
  )
)
with check (
  company_id = public.current_company_id()
  and (
    public.can_manage_company()
    or responsible_id = auth.uid()
    or created_by = auth.uid()
  )
);

create policy "calendar_events_delete_manager_only"
on public.calendar_events for delete
to authenticated
using (company_id = public.current_company_id() and public.can_manage_company());
