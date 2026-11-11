-- 2026-11-09 · Formulario de contacto → CRM de MAYA
-- 1) Columnas para ubicación, proyecto y estado de envío al CRM (APLICADA)
alter table public.contact_leads
  add column if not exists location text,
  add column if not exists project_name text,
  add column if not exists crm_lead_code text,
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_error text;

-- 2) Cerrar la "puerta trasera": el formulario ya guarda desde el servidor (service role)
--    PENDIENTE de confirmar en Supabase al momento de escribir esto.
drop policy if exists "Permitir crear contactos a cualquier usuario" on public.contact_leads;
revoke insert on public.contact_leads from anon;
