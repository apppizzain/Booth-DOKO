-- Add admin-configurable attendance hours to existing DOKO settings.
alter table public.doko_settings add column if not exists attendance_check_in text not null default '16:00';
alter table public.doko_settings add column if not exists attendance_check_out text not null default '23:00';
alter table public.doko_settings add column if not exists attendance_tolerance_minutes integer not null default 0;