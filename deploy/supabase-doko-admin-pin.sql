-- Add admin PIN storage for Pizzain DOKO.
-- Run this once in the same Supabase SQL Editor if your doko_settings table already exists.

alter table public.doko_settings
  add column if not exists admin_pin text not null default '0000';

update public.doko_settings
set admin_pin = '0000',
    updated_at = now()
where app_id = 'pizzain_doko_v1'
  and (admin_pin is null or admin_pin = '');
