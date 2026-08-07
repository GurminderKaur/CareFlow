-- CareFlow core schema (Milestone 2)

create extension if not exists pgcrypto;

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date not null,
  phone text,
  email text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_date timestamptz not null,
  visit_type text not null,
  notes text not null,
  summary text,
  follow_up_instructions text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_outputs (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits(id) on delete cascade,
  summary text,
  follow_up_instructions text,
  error_message text,
  model_name text not null,
  status text not null check (status in ('completed', 'failed')),
  created_at timestamptz not null default now(),
  constraint ai_outputs_status_result_check check (
    (status = 'completed' and summary is not null and follow_up_instructions is not null)
    or (status = 'failed' and error_message is not null)
  )
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('patient', 'visit', 'subscription')),
  entity_id uuid not null,
  action text not null,
  performed_by uuid not null references auth.users(id),
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Foreign-key lookup indexes (Postgres does not index FK columns automatically).
create index if not exists visits_patient_id_idx on visits (patient_id);
create index if not exists ai_outputs_visit_id_idx on ai_outputs (visit_id);
create index if not exists audit_events_entity_id_idx on audit_events (entity_id);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);

-- Keep updated_at current on writes.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists patients_set_updated_at on patients;
create trigger patients_set_updated_at
  before update on patients
  for each row execute function set_updated_at();

drop trigger if exists visits_set_updated_at on visits;
create trigger visits_set_updated_at
  before update on visits
  for each row execute function set_updated_at();

drop trigger if exists subscriptions_set_updated_at on subscriptions;
create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- Row-Level Security: any authenticated user has full access (single-clinic MVP).
alter table patients enable row level security;
alter table visits enable row level security;
alter table ai_outputs enable row level security;
alter table audit_events enable row level security;
alter table subscriptions enable row level security;

drop policy if exists "authenticated full access" on patients;
create policy "authenticated full access" on patients
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on visits;
create policy "authenticated full access" on visits
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on ai_outputs;
create policy "authenticated full access" on ai_outputs
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on audit_events;
create policy "authenticated full access" on audit_events
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on subscriptions;
create policy "authenticated full access" on subscriptions
  for all to authenticated using (true) with check (true);

-- Milestone 4 migration: allow ai_outputs to record failed generation attempts.
-- Safe to re-run; only needed if ai_outputs already exists from Milestone 2.
alter table ai_outputs alter column summary drop not null;
alter table ai_outputs alter column follow_up_instructions drop not null;
alter table ai_outputs add column if not exists error_message text;

alter table ai_outputs drop constraint if exists ai_outputs_status_result_check;
alter table ai_outputs add constraint ai_outputs_status_result_check check (
  (status = 'completed' and summary is not null and follow_up_instructions is not null)
  or (status = 'failed' and error_message is not null)
);
