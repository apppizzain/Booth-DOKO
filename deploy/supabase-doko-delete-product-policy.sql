-- Allow product delete only for this Pizzain DOKO app.
-- Run this once in Supabase SQL Editor if deleted products return after refresh.
-- Scope is locked to app_id = 'pizzain_doko_v1' so it does not affect other apps in the project.

drop policy if exists "DOKO pizzas delete" on public.doko_pizzas;

create policy "DOKO pizzas delete"
  on public.doko_pizzas for delete
  to anon
  using (app_id = 'pizzain_doko_v1');
