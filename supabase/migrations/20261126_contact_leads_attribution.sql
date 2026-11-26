-- Aplicada en maya-db el 2026-11-26: origen de campaña (UTM) y envío a la API de Conversiones de Meta
alter table public.contact_leads
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists fbclid text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists meta_event_id text,
  add column if not exists meta_capi_sent_at timestamptz,
  add column if not exists meta_capi_error text;
create index if not exists contact_leads_utm_campaign_idx on public.contact_leads (utm_campaign);
