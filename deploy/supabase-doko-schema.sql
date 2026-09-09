-- Pizzain DOKO isolated tables for Supabase
-- Run this in Supabase SQL Editor for project qipqhopjbwjquschrggt.
-- These tables use the doko_ prefix and app_id = 'pizzain_doko_v1' so they do not touch other apps in the same Supabase project.

create table if not exists public.doko_settings (
  app_id text primary key,
  owner_fee integer not null default 2000,
  updated_at timestamptz not null default now()
);

create table if not exists public.doko_pizzas (
  app_id text not null,
  id text not null,
  name text not null,
  cost integer not null check (cost >= 0),
  price integer not null check (price >= 0),
  active boolean not null default true,
  image text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (app_id, id)
);

create table if not exists public.doko_daily_records (
  app_id text not null,
  record_date date not null,
  sales jsonb not null default '{}'::jsonb,
  stock jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  primary key (app_id, record_date)
);

create table if not exists public.doko_daily_expenses (
  app_id text not null,
  id text not null,
  record_date date not null,
  note text not null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (app_id, id)
);
create table if not exists public.doko_attendance (
  app_id text not null,
  record_date date not null,
  in_record jsonb,
  out_record jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (app_id, record_date)
);

create index if not exists doko_pizzas_app_sort_idx
  on public.doko_pizzas (app_id, sort_order);

create index if not exists doko_daily_records_app_date_idx
  on public.doko_daily_records (app_id, record_date desc);

create index if not exists doko_daily_expenses_app_date_idx
  on public.doko_daily_expenses (app_id, record_date desc, created_at desc);
create index if not exists doko_attendance_app_date_idx
  on public.doko_attendance (app_id, record_date desc);

alter table public.doko_settings add column if not exists admin_pin text not null default '0000';
alter table public.doko_settings add column if not exists attendance_check_in text not null default '16:00';
alter table public.doko_settings add column if not exists attendance_check_out text not null default '23:00';
alter table public.doko_settings add column if not exists attendance_tolerance_minutes integer not null default 0;

alter table public.doko_settings enable row level security;
alter table public.doko_pizzas enable row level security;
alter table public.doko_daily_records enable row level security;
alter table public.doko_daily_expenses enable row level security;
alter table public.doko_attendance enable row level security;

drop policy if exists "DOKO settings read" on public.doko_settings;
drop policy if exists "DOKO settings insert" on public.doko_settings;
drop policy if exists "DOKO settings update" on public.doko_settings;

create policy "DOKO settings read"
  on public.doko_settings for select
  to anon
  using (app_id = 'pizzain_doko_v1');

create policy "DOKO settings insert"
  on public.doko_settings for insert
  to anon
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO settings update"
  on public.doko_settings for update
  to anon
  using (app_id = 'pizzain_doko_v1')
  with check (app_id = 'pizzain_doko_v1');

drop policy if exists "DOKO pizzas read" on public.doko_pizzas;
drop policy if exists "DOKO pizzas insert" on public.doko_pizzas;
drop policy if exists "DOKO pizzas update" on public.doko_pizzas;
drop policy if exists "DOKO pizzas delete" on public.doko_pizzas;

create policy "DOKO pizzas read"
  on public.doko_pizzas for select
  to anon
  using (app_id = 'pizzain_doko_v1');

create policy "DOKO pizzas insert"
  on public.doko_pizzas for insert
  to anon
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO pizzas update"
  on public.doko_pizzas for update
  to anon
  using (app_id = 'pizzain_doko_v1')
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO pizzas delete"
  on public.doko_pizzas for delete
  to anon
  using (app_id = 'pizzain_doko_v1');

drop policy if exists "DOKO records read" on public.doko_daily_records;
drop policy if exists "DOKO records insert" on public.doko_daily_records;
drop policy if exists "DOKO records update" on public.doko_daily_records;

create policy "DOKO records read"
  on public.doko_daily_records for select
  to anon
  using (app_id = 'pizzain_doko_v1');

create policy "DOKO records insert"
  on public.doko_daily_records for insert
  to anon
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO records update"
  on public.doko_daily_records for update
  to anon
  using (app_id = 'pizzain_doko_v1')
  with check (app_id = 'pizzain_doko_v1');


drop policy if exists "DOKO expenses read" on public.doko_daily_expenses;
drop policy if exists "DOKO expenses insert" on public.doko_daily_expenses;
drop policy if exists "DOKO expenses update" on public.doko_daily_expenses;
drop policy if exists "DOKO expenses delete" on public.doko_daily_expenses;

create policy "DOKO expenses read"
  on public.doko_daily_expenses for select
  to anon
  using (app_id = 'pizzain_doko_v1');

create policy "DOKO expenses insert"
  on public.doko_daily_expenses for insert
  to anon
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO expenses update"
  on public.doko_daily_expenses for update
  to anon
  using (app_id = 'pizzain_doko_v1')
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO expenses delete"
  on public.doko_daily_expenses for delete
  to anon
  using (app_id = 'pizzain_doko_v1');
drop policy if exists "DOKO attendance read" on public.doko_attendance;
drop policy if exists "DOKO attendance insert" on public.doko_attendance;
drop policy if exists "DOKO attendance update" on public.doko_attendance;

create policy "DOKO attendance read"
  on public.doko_attendance for select
  to anon
  using (app_id = 'pizzain_doko_v1');

create policy "DOKO attendance insert"
  on public.doko_attendance for insert
  to anon
  with check (app_id = 'pizzain_doko_v1');

create policy "DOKO attendance update"
  on public.doko_attendance for update
  to anon
  using (app_id = 'pizzain_doko_v1')
  with check (app_id = 'pizzain_doko_v1');

