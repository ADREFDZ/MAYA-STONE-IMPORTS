-- Aplicada en maya-db el 2026-11-19: estado del envío de cada lead a Monday
alter table public.contact_leads
  add column if not exists monday_item_id text,
  add column if not exists monday_synced_at timestamptz,
  add column if not exists monday_error text;
comment on column public.contact_leads.monday_item_id is 'ID del lead creado en Monday (tablero 1. Leads)';
