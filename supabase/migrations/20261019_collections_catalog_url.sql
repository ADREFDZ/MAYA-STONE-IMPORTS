-- Catálogo digital (PDF) por colección
alter table public.collections add column if not exists catalog_url text;
