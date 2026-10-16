-- =============================================================================
-- MAYA — Endurecimiento de seguridad (RLS, grants y funciones)
-- Fecha: 2026-10-14
-- -----------------------------------------------------------------------------
-- Objetivo: que SOLO los administradores (profiles.role = 'admin') puedan
-- modificar contenido, que nadie pueda auto-asignarse el rol admin y que los
-- datos personales de `profiles` no sean públicos.
--
-- No borra datos. No cambia lo que ve el sitio público.
-- Las Server Actions que usan service_role (createAdminClient) no se ven
-- afectadas: service_role ignora RLS.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Helper: ¿el usuario actual es admin?
--    SECURITY DEFINER para leer profiles sin pasar por su RLS (evita recursión).
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'::public.user_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. PROFILES
--    - Se elimina la lectura pública (exponía nombre, email y teléfono).
--    - Un usuario ya no puede cambiar su propio `role` (escalada a admin).
-- -----------------------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Permitir actualización solo a admins" on public.profiles;
drop policy if exists "Permitir eliminación solo a admins" on public.profiles;
-- Se conserva: "Permitir ver perfil propio" (auth.uid() = id)

create policy "Admins leen todos los perfiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "Usuario actualiza su propio perfil"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins actualizan cualquier perfil"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins eliminan perfiles"
  on public.profiles for delete to authenticated
  using (public.is_admin());

-- Permisos de columna: el rol solo lo cambia un admin vía service_role.
-- Los perfiles los crea el trigger handle_new_user (SECURITY DEFINER).
revoke insert, update on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;
grant update (name, phone, country_code, updated_at) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 2. CONTENIDO: lectura pública, escritura solo admins
-- -----------------------------------------------------------------------------

-- collections
drop policy if exists "Permitir actualizar a usuarios autenticados en collections" on public.collections;
drop policy if exists "Permitir eliminar a usuarios autenticados en collections" on public.collections;
drop policy if exists "Permitir insertar a usuarios autenticados en collections" on public.collections;
create policy "Admins gestionan collections"
  on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- collection_products
drop policy if exists "Permitir insertar en collection_products" on public.collection_products;
drop policy if exists "Permitir eliminar en collection_products" on public.collection_products;
create policy "Admins gestionan collection_products"
  on public.collection_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- material_renders (antes: CUALQUIERA, incluso sin sesión, podía insertar/editar/borrar)
drop policy if exists "Permitir actualizacion en material_renders" on public.material_renders;
drop policy if exists "Permitir eliminacion en material_renders" on public.material_renders;
drop policy if exists "Permitir insercion en material_renders" on public.material_renders;
create policy "Admins gestionan material_renders"
  on public.material_renders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- projects (lectura: activos para todos; borradores solo admins)
drop policy if exists "Lectura pública de proyectos activos" on public.projects;
drop policy if exists "Gestión completa para administradores" on public.projects;
create policy "Lectura pública de proyectos activos"
  on public.projects for select
  using (is_active = true or public.is_admin());
create policy "Admins gestionan projects"
  on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- bespoke_finishes
drop policy if exists "Gestión completa para administradores" on public.bespoke_finishes;
create policy "Admins gestionan bespoke_finishes"
  on public.bespoke_finishes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- gallery_photos
drop policy if exists "Solo administradores pueden gestionar la tabla de galería" on public.gallery_photos;
create policy "Admins gestionan gallery_photos"
  on public.gallery_photos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. STORAGE: lectura pública se mantiene; subir/editar/borrar solo admins
-- -----------------------------------------------------------------------------
drop policy if exists "Delete Access Materials" on storage.objects;
drop policy if exists "Update Access Materials" on storage.objects;
drop policy if exists "Upload Access Materials" on storage.objects;
drop policy if exists "Subida y gestión autenticada en bucket projects" on storage.objects;
drop policy if exists "Solo administradores pueden borrar archivos de editorial_galler" on storage.objects;
drop policy if exists "Solo administradores pueden subir archivos a editorial_gallery" on storage.objects;
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Anyone can update their own avatar." on storage.objects;

create policy "Admins suben archivos de contenido"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('materials', 'projects', 'editorial_gallery', 'project-files')
    and public.is_admin()
  );

create policy "Admins editan archivos de contenido"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('materials', 'projects', 'editorial_gallery', 'project-files')
    and public.is_admin()
  );

create policy "Admins borran archivos de contenido"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('materials', 'projects', 'editorial_gallery', 'project-files')
    and public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 4. FUNCIONES (avisos del asesor de Supabase)
-- -----------------------------------------------------------------------------
-- handle_new_user es un trigger: nadie debe poder llamarla por /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- search_path fijo y sin ejecución pública
alter function public.mark_out_of_stock_products(timestamp with time zone)
  set search_path = '';
revoke execute on function public.mark_out_of_stock_products(timestamp with time zone)
  from public, anon;

commit;
