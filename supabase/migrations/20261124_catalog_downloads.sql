-- Aplicada en maya-db el 2026-11-24: conteo anónimo de descargas de catálogos
create table if not exists public.catalog_downloads (
  id bigint generated always as identity primary key,
  catalog text not null,
  source text not null default 'otro',
  lang text,
  created_at timestamptz not null default now()
);
comment on table public.catalog_downloads is 'Conteo anónimo de descargas de catálogos PDF (sin datos personales). Se inserta desde el servidor.';
create index if not exists catalog_downloads_created_at_idx on public.catalog_downloads (created_at desc);
alter table public.catalog_downloads enable row level security;
create policy "Admins leen descargas de catalogos" on public.catalog_downloads
  for select to authenticated using (is_admin());
