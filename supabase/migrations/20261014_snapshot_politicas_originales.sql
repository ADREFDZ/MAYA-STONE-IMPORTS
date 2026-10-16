-- =============================================================================
-- RESPALDO de las políticas RLS ANTES del endurecimiento (2026-10-14)
-- -----------------------------------------------------------------------------
-- Sirve para regresar exactamente al estado anterior si algo del panel admin
-- dejara de funcionar. Uso: borrar las políticas nuevas y ejecutar este archivo.
-- (Las políticas no contienen datos; aplicarlas o quitarlas no borra filas.)
-- =============================================================================

create policy "Gestión completa para administradores" on public.bespoke_finishes as PERMISSIVE for ALL to public using ((auth.role() = 'authenticated'::text));
create policy "Lectura pública de acabados bespoke" on public.bespoke_finishes as PERMISSIVE for SELECT to public using ((is_active = true));
create policy "Permitir eliminar en collection_products" on public.collection_products as PERMISSIVE for DELETE to authenticated using (true);
create policy "Permitir insertar en collection_products" on public.collection_products as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Permitir lectura publica de collection_products" on public.collection_products as PERMISSIVE for SELECT to public using (true);
create policy "Permitir actualizar a usuarios autenticados en collections" on public.collections as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Permitir eliminar a usuarios autenticados en collections" on public.collections as PERMISSIVE for DELETE to authenticated using (true);
create policy "Permitir insertar a usuarios autenticados en collections" on public.collections as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Permitir lectura publica de collections" on public.collections as PERMISSIVE for SELECT to public using (true);
create policy "Permitir crear contactos a cualquier usuario" on public.contact_leads as PERMISSIVE for INSERT to public with check (true);
create policy "Permitir lectura y actualización solo a admins" on public.contact_leads as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
create policy "Cualquiera puede ver la galería" on public.gallery_photos as PERMISSIVE for SELECT to public using (true);
create policy "Solo administradores pueden gestionar la tabla de galería" on public.gallery_photos as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Permitir actualizacion en material_renders" on public.material_renders as PERMISSIVE for UPDATE to public using (true);
create policy "Permitir eliminacion en material_renders" on public.material_renders as PERMISSIVE for DELETE to public using (true);
create policy "Permitir insercion en material_renders" on public.material_renders as PERMISSIVE for INSERT to public with check (true);
create policy "Permitir lectura publica de material_renders" on public.material_renders as PERMISSIVE for SELECT to public using (true);
create policy "Permitir lectura publica de productos" on public.products as PERMISSIVE for SELECT to public using (true);
create policy "Permitir modificacion solo a administradores" on public.products as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))) with check ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
create policy "Admins can update any profile" on public.profiles as PERMISSIVE for UPDATE to public using ((EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))) with check ((EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role)))));
create policy "Permitir actualización solo a admins" on public.profiles as PERMISSIVE for UPDATE to public using ((EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role)))));
create policy "Permitir eliminación solo a admins" on public.profiles as PERMISSIVE for DELETE to public using ((EXISTS ( SELECT 1 FROM profiles profiles_1 WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role)))));
create policy "Permitir ver perfil propio" on public.profiles as PERMISSIVE for SELECT to public using ((auth.uid() = id));
create policy "Public profiles are viewable by everyone." on public.profiles as PERMISSIVE for SELECT to public using (true);
create policy "Users can insert their own profile." on public.profiles as PERMISSIVE for INSERT to public with check ((( SELECT auth.uid() AS uid) = id));
create policy "Users can update own profile." on public.profiles as PERMISSIVE for UPDATE to public using ((( SELECT auth.uid() AS uid) = id));
create policy "Gestión completa para administradores" on public.projects as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Lectura pública de proyectos activos" on public.projects as PERMISSIVE for SELECT to public using (((is_active = true) OR (auth.role() = 'authenticated'::text)));
create policy "Permitir escritura en sync_logs solo a admins" on public.sync_logs as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
create policy "Permitir lectura de sync_logs solo a admins" on public.sync_logs as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));
create policy "Acceso público de lectura a editorial_gallery" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'editorial_gallery'::text));
create policy "Anyone can update their own avatar." on storage.objects as PERMISSIVE for UPDATE to public using ((( SELECT auth.uid() AS uid) = owner)) with check ((bucket_id = 'avatars'::text));
create policy "Authenticated users can upload files" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'project-files'::text));
create policy "Delete Access Materials" on storage.objects as PERMISSIVE for DELETE to public using ((bucket_id = 'materials'::text));
create policy "Lectura pública de fotos de proyectos" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'projects'::text));
create policy "Public Read Access Materials" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'materials'::text));
create policy "Solo administradores pueden borrar archivos de editorial_galler" on storage.objects as PERMISSIVE for DELETE to authenticated using ((bucket_id = 'editorial_gallery'::text));
create policy "Solo administradores pueden subir archivos a editorial_gallery" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'editorial_gallery'::text));
create policy "Subida y gestión autenticada en bucket projects" on storage.objects as PERMISSIVE for ALL to authenticated using ((bucket_id = 'projects'::text)) with check ((bucket_id = 'projects'::text));
create policy "Update Access Materials" on storage.objects as PERMISSIVE for UPDATE to public using ((bucket_id = 'materials'::text));
create policy "Upload Access Materials" on storage.objects as PERMISSIVE for INSERT to public with check ((bucket_id = 'materials'::text));
create policy "Users can read project files" on storage.objects as PERMISSIVE for SELECT to authenticated using ((bucket_id = 'project-files'::text));

-- Permisos de tabla originales de profiles (anon y authenticated tenían todos)
grant select, insert, update on public.profiles to anon, authenticated;
grant execute on function public.handle_new_user() to anon, authenticated;
