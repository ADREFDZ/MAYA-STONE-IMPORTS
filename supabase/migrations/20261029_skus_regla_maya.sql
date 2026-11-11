begin;
create table if not exists backup_products_20261029b as select * from products;
create table if not exists backup_collection_products_20261029b as select * from collection_products;
create table if not exists backup_material_renders_20261029b as select * from material_renders;
delete from products where status='inactive';
update material_renders set product_sku='011070060501001' where product_sku='011070060801001';
delete from products where sku='011070060801001';
update products set aka='Volakas', finishes='["Honed","Sandblasted"]'::jsonb, updated_at=now() where sku='011070060501001';
update material_renders set product_sku='011060230501015' where product_sku='011060230301001';
delete from products where sku='011060230301001';
update products set aka='Silk Georgette', product_name='Silk Georgette', finishes='["Honed","Brushed"]'::jsonb, updated_at=now() where sku='011060230501015';
update material_renders set product_sku='011060011401003' where product_sku='011050050501008';
delete from products where sku='011050050501008';
update products set aka='Rimini Beige', product_name='Rimini Beige', finishes='["Leather","Honed"]'::jsonb, updated_at=now() where sku='011060011401003';
update material_renders set product_sku='021030030201001' where product_sku='021030031401002';
delete from products where sku='021030031401002';
update products set aka='San Gabriel', origin='Brasil', finishes='["Natural cut","Leather"]'::jsonb, updated_at=now() where sku='021030030201001';
update material_renders set product_sku='011010110501006' where product_sku='011060230101003';
delete from products where sku='011060230101003';
update products set aka='Rosso Levanto', finishes='["Honed","Polished"]'::jsonb, updated_at=now() where sku='011010110501006';
update material_renders set product_sku='041060010501' where product_sku='041030031401';
delete from products where sku='041030031401';
update products set aka='Taj Mahal', origin='Brasil', finishes='["Honed","Leather"]'::jsonb, updated_at=now() where sku='041060010501';
update material_renders set product_sku='031040020202006' where product_sku='081040020201002';
delete from products where sku='081040020201002';
update products set aka='Ivory', product_name='Travertino Ivory', type='SLAB', origin='México', formats='["Placa","60 x 120 x 2 cm","40 x LL x 1 cm","Brick","Customizable"]'::jsonb, finishes='["Natural Cut","Sandblasted","Spazzolato","Bamboo","Brushed","Honed","Polished","Bush-hammered"]'::jsonb, updated_at=now() where sku='031040020202006';
update products set aka='Terra', origin='México', formats='["Placa","60 x 120 x 2 cm","40 x LL x 1 cm","Brick","Customizable"]'::jsonb, finishes='["Natural Cut","Sandblasted","Spazzolato","Bamboo","Brushed","Honed","Polished","Bush-hammered"]'::jsonb, updated_at=now() where sku='11040020501';
update products set aka='Portoro Gold', updated_at=now() where sku='11010110501016';
update products set aka='Breccia Damascata', updated_at=now() where sku='11010110101004';
update products set aka='Silver', origin='Asia', updated_at=now() where sku='031060230501';
update products set aka='Limestone Ivory', stone_type='Limestone', updated_at=now() where sku='011040140302';
update products set stone_type='Granite' where sku='041030031401007';
update products set sku='MAR-GR-HO-001', updated_at=now() where sku='011070060501001';
update products set sku='MAR-GR-PU-002', updated_at=now() where sku='011060010101006';
update products set sku='MAR-ME-HO-003', updated_at=now() where sku='011090100502003';
update products set sku='MAR-AS-HO-004', updated_at=now() where sku='011060010501004';
update products set sku='MAR-AS-PU-005', updated_at=now() where sku='011060230101001';
update products set sku='MAR-TR-HO-006', updated_at=now() where sku='011050050501007';
update products set sku='MAR-AS-HO-007', updated_at=now() where sku='011060230501015';
update products set sku='MAR-TR-HO-008', updated_at=now() where sku='011050050502001';
update products set sku='MAR-GR-PU-009', updated_at=now() where sku='011070060101002';
update products set sku='MAR-TR-HO-010', updated_at=now() where sku='011050100501001';
update products set sku='MAR-AS-HO-011', updated_at=now() where sku='011060230501020';
update products set sku='MAR-AS-SA-012', updated_at=now() where sku='011060010801003';
update products set sku='MAR-TR-LE-013', updated_at=now() where sku='011060011401003';
update products set sku='MAR-TR-HO-014', updated_at=now() where sku='011060230501006';
update products set sku='CUA-BR-PU-001', updated_at=now() where sku='041030030201002';
update products set sku='CUA-AS-PU-002', updated_at=now() where sku='041060230101001';
update products set sku='CUA-BR-HO-003', updated_at=now() where sku='041060010501';
update products set sku='CUA-BR-HO-004', updated_at=now() where sku='041030030501005';
update products set sku='GRA-IN-LE-001', updated_at=now() where sku='021080041401001';
update products set sku='GRA-IN-LE-002', updated_at=now() where sku='041030031401007';
update products set sku='GRA-BR-CO-003', updated_at=now() where sku='021030030201001';
update products set sku='GRA-BR-LE-004', updated_at=now() where sku='021030031401001';
update products set sku='GRA-BR-CO-005', updated_at=now() where sku='021030120202033';
update products set sku='GRA-BR-CO-006', updated_at=now() where sku='021030300201001';
update products set sku='CAL-IT-HO-001', updated_at=now() where sku='011010110501016';
update products set sku='MAR-IT-HO-015', updated_at=now() where sku='011010110501008';
update products set sku='MAR-IT-HO-016', updated_at=now() where sku='011010110501018';
update products set sku='MAR-IT-HO-017', updated_at=now() where sku='011010110501005';
update products set sku='MAR-IT-HO-018', updated_at=now() where sku='011010110501001';
update products set sku='MAR-IT-HO-019', updated_at=now() where sku='011010110501004';
update products set sku='MAR-IT-PU-020', updated_at=now() where sku='011010110101003';
update products set sku='MAR-IT-HO-021', updated_at=now() where sku='11010110101004';
update products set sku='MAR-IT-HO-022', updated_at=now() where sku='11010110501003';
insert into products (sku,product_name,aka,type,kind,category,stone_type,origin,status,formats,finishes,uses) values ('MAR-IT-PU-023','Calacatta Viola Extra Polished','Calacatta Viola Extra','SLAB','Stock','Natural Stone','Marble','Italia','active','["300 x 184 cm"]'::jsonb,'["Polished"]'::jsonb,array['Fachadas','Muros interiores','Exterior residencial','Interior comercial','Interior residencial','Zonas Húmedas']::text[]);
update products set sku='MAR-IT-HO-024', updated_at=now() where sku='011010110501006';
update products set sku='MAR-IT-PU-025', updated_at=now() where sku='011050050501001';
update products set sku='MAR-IT-HO-026', updated_at=now() where sku='011010110501002';
update products set sku='MAR-IT-HO-027', updated_at=now() where sku='011010110501011';
update products set sku='MAR-IT-PU-028', updated_at=now() where sku='011010110101001';
update products set sku='MAR-AS-PU-029', updated_at=now() where sku='011060010101003';
update products set sku='MAR-IT-HO-030', updated_at=now() where sku='041010110501016';
update products set sku='MAR-IT-HO-031', updated_at=now() where sku='011010110501013';
update products set sku='MAR-IT-HO-032', updated_at=now() where sku='011010110501012';
update products set sku='MAR-IT-PU-033', updated_at=now() where sku='011010110101005';
update products set sku='MAR-IT-HO-034', updated_at=now() where sku='011010110501010';
update products set sku='MAR-AS-SA-035', updated_at=now() where sku='011060012301001';
update products set sku='MAR-IT-PU-036', updated_at=now() where sku='11010110501016';
insert into products (sku,product_name,aka,type,kind,category,stone_type,origin,status,formats,finishes,uses) values ('MAR-IT-HO-037','Calacatta Monet Honed','Calacatta Monet','SLAB','Stock','Natural Stone','Marble','Italia','active','[]'::jsonb,'["Honed"]'::jsonb,array['Fachadas','Muros interiores','Exterior residencial','Interior comercial','Interior residencial','Zonas Húmedas']::text[]);
update products set sku='MAR-IT-HO-038', updated_at=now() where sku='011010110501020';
update products set sku='MAR-IT-PU-039', updated_at=now() where sku='011010110101006';
update products set sku='CUA-BR-LE-005', updated_at=now() where sku='041030031401006';
update products set sku='CUA-BR-HO-006', updated_at=now() where sku='041030030501001';
update products set sku='CUA-BR-HO-007', updated_at=now() where sku='041030030201003';
update products set sku='CUA-AS-HO-008', updated_at=now() where sku='041060230501001';
update products set sku='CUA-BR-LE-009', updated_at=now() where sku='041030031401004';
update products set sku='CUA-BR-HO-010', updated_at=now() where sku='041030030501004';
update products set sku='CUA-BR-HO-011', updated_at=now() where sku='041030030501003';
update products set sku='CUA-BR-LE-012', updated_at=now() where sku='041030031401009';
update products set sku='TRV-MX-CO-001', updated_at=now() where sku='031040020202006';
insert into products (sku,product_name,aka,type,kind,category,stone_type,origin,status,formats,finishes,uses) values ('TRV-MX-CO-002','Travertino Ivory Mosaic','Mosaic','TILE','Stock','Natural Stone','Travertino','México','active','["Mosaico"]'::jsonb,'["Natural Cut"]'::jsonb,array['Fachadas','Muros interiores','Interior comercial','Interior residencial','Zonas Húmedas']::text[]);
insert into products (sku,product_name,aka,type,kind,category,stone_type,origin,status,formats,finishes,uses) values ('TRV-MX-CO-003','Travertino Ivory Versailles','Versailles','TILE','Stock','Natural Stone','Travertino','México','active','["Versailles"]'::jsonb,'["Natural Cut"]'::jsonb,array['Fachadas','Muros interiores','Interior comercial','Interior residencial','Zonas Húmedas']::text[]);
insert into products (sku,product_name,aka,type,kind,category,stone_type,origin,status,formats,finishes,uses) values ('TRV-MX-TU-004','Travertino Ivory Brick','Brick','TILE','Stock','Natural Stone','Travertino','México','active','["Brick"]'::jsonb,'["Tumbled"]'::jsonb,array['Fachadas','Muros interiores','Interior comercial','Interior residencial','Zonas Húmedas']::text[]);
update products set sku='TRV-MX-HO-005', updated_at=now() where sku='11040020501';
update products set sku='TRV-AS-HO-006', updated_at=now() where sku='031060230501';
update products set sku='CAL-MX-CE-002', updated_at=now() where sku='011040140302';
insert into collection_products (collection_id,product_sku,sort_order) select c.id, v.sku, v.ord from collections c join (values ('MAR-GR-HO-001',1),('MAR-GR-PU-002',2),('MAR-ME-HO-003',3),('MAR-AS-HO-004',4),('MAR-AS-PU-005',5),('MAR-TR-HO-006',6),('MAR-AS-HO-007',7),('MAR-TR-HO-008',8),('MAR-GR-PU-009',9),('MAR-TR-HO-010',10),('MAR-AS-HO-011',11),('MAR-AS-SA-012',12),('MAR-TR-LE-013',13),('MAR-TR-HO-014',14),('CUA-BR-PU-001',15),('CUA-AS-PU-002',16),('CUA-BR-HO-003',17),('CUA-BR-HO-004',18),('GRA-IN-LE-001',19),('GRA-IN-LE-002',20),('GRA-BR-CO-003',21),('GRA-BR-LE-004',22),('GRA-BR-CO-005',23),('GRA-BR-CO-006',24),('CAL-IT-HO-001',25)) as v(sku,ord) on true where c.slug='essentials' on conflict (collection_id,product_sku) do update set sort_order=excluded.sort_order;
insert into collection_products (collection_id,product_sku,sort_order) select c.id, v.sku, v.ord from collections c join (values ('MAR-IT-HO-015',1),('MAR-IT-HO-016',2),('MAR-IT-HO-017',3),('MAR-IT-HO-018',4),('MAR-IT-HO-019',5),('MAR-IT-PU-020',6),('MAR-IT-HO-021',7),('MAR-IT-HO-022',8),('MAR-IT-PU-023',9),('MAR-IT-HO-024',10),('MAR-IT-PU-025',11),('MAR-IT-HO-026',12),('MAR-IT-HO-027',13),('MAR-IT-PU-028',14),('MAR-AS-PU-029',15),('MAR-IT-HO-030',16),('MAR-IT-HO-031',17),('MAR-IT-HO-032',18),('MAR-IT-PU-033',19),('MAR-IT-HO-034',20),('MAR-AS-SA-035',21),('MAR-IT-PU-036',22),('MAR-IT-HO-037',23),('MAR-IT-HO-038',24),('MAR-IT-PU-039',25),('CUA-BR-LE-005',26),('CUA-BR-HO-006',27),('CUA-BR-HO-007',28),('CUA-AS-HO-008',29),('CUA-BR-LE-009',30),('CUA-BR-HO-010',31),('CUA-BR-HO-011',32),('CUA-BR-LE-012',33)) as v(sku,ord) on true where c.slug='reserve' on conflict (collection_id,product_sku) do update set sort_order=excluded.sort_order;
insert into collection_products (collection_id,product_sku,sort_order) select c.id, v.sku, v.ord from collections c join (values ('TRV-MX-CO-001',1),('TRV-MX-CO-002',2),('TRV-MX-CO-003',3),('TRV-MX-TU-004',4),('TRV-MX-HO-005',5),('TRV-AS-HO-006',6)) as v(sku,ord) on true where c.slug='travertino' on conflict (collection_id,product_sku) do update set sort_order=excluded.sort_order;
insert into collection_products (collection_id,product_sku,sort_order) select c.id, v.sku, v.ord from collections c join (values ('CAL-MX-CE-002',1)) as v(sku,ord) on true where c.slug='dune-ivory' on conflict (collection_id,product_sku) do update set sort_order=excluded.sort_order;
create table if not exists public.sku_codes (
  kind text not null check (kind in ('tipo','pais','acabado')),
  code text not null check (code ~ '^[A-Z]{2,3}$'),
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (kind, code),
  check ((kind='tipo' and length(code)=3) or (kind<>'tipo' and length(code)=2))
);
create table if not exists public.sku_counters (
  tipo text primary key,
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now()
);
alter table public.sku_codes enable row level security;
alter table public.sku_counters enable row level security;
drop policy if exists sku_codes_admin_read on public.sku_codes;
create policy sku_codes_admin_read on public.sku_codes for select to authenticated using (public.is_admin());
drop policy if exists sku_codes_admin_write on public.sku_codes;
create policy sku_codes_admin_write on public.sku_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists sku_counters_admin_read on public.sku_counters;
create policy sku_counters_admin_read on public.sku_counters for select to authenticated using (public.is_admin());
insert into public.sku_codes (kind,code,label) values ('tipo','MAR','Mármol'),('tipo','CUA','Cuarcita'),('tipo','GRA','Granito'),('tipo','TRV','Travertino'),('tipo','CAL','Caliza'),('tipo','ONI','Ónix'),('tipo','MAD','Madera'),('tipo','OTR','Otros'),('pais','IT','Italia'),('pais','GR','Grecia'),('pais','TR','Turquía'),('pais','BR','Brasil'),('pais','MX','México'),('pais','IN','India'),('pais','AS','Asia'),('pais','ME','Medio Oriente'),('pais','ES','España'),('pais','PT','Portugal'),('pais','US','Estados Unidos'),('acabado','HO','Honed'),('acabado','PU','Polished'),('acabado','LE','Leather'),('acabado','CO','Natural cut'),('acabado','CE','Brushed'),('acabado','SA','Sandblasted'),('acabado','SP','Spazzolato'),('acabado','BA','Bamboo'),('acabado','TU','Tumbled'),('acabado','AB','Bush-hammered'),('acabado','FL','Flamed'),('acabado','NA','Natural / sin acabado') on conflict (kind,code) do nothing;
insert into public.sku_counters (tipo,last_value) values ('MAR',39) on conflict (tipo) do update set last_value=greatest(public.sku_counters.last_value,excluded.last_value);
insert into public.sku_counters (tipo,last_value) values ('CUA',12) on conflict (tipo) do update set last_value=greatest(public.sku_counters.last_value,excluded.last_value);
insert into public.sku_counters (tipo,last_value) values ('GRA',6) on conflict (tipo) do update set last_value=greatest(public.sku_counters.last_value,excluded.last_value);
insert into public.sku_counters (tipo,last_value) values ('CAL',2) on conflict (tipo) do update set last_value=greatest(public.sku_counters.last_value,excluded.last_value);
insert into public.sku_counters (tipo,last_value) values ('TRV',6) on conflict (tipo) do update set last_value=greatest(public.sku_counters.last_value,excluded.last_value);
insert into public.sku_counters (tipo,last_value) select code,0 from public.sku_codes where kind='tipo' on conflict (tipo) do nothing;
create or replace function public.next_product_sku(p_tipo text, p_pais text, p_acabado text)
returns text
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_next integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado para generar SKUs';
  end if;
  p_tipo := upper(trim(p_tipo)); p_pais := upper(trim(p_pais)); p_acabado := upper(trim(p_acabado));
  if not exists (select 1 from public.sku_codes where kind='tipo' and code=p_tipo and is_active) then raise exception 'Tipo de SKU no válido: %', p_tipo; end if;
  if not exists (select 1 from public.sku_codes where kind='pais' and code=p_pais and is_active) then raise exception 'País de SKU no válido: %', p_pais; end if;
  if not exists (select 1 from public.sku_codes where kind='acabado' and code=p_acabado and is_active) then raise exception 'Acabado de SKU no válido: %', p_acabado; end if;
  -- Incremento atómico: dos guardados simultáneos nunca obtienen el mismo número
  insert into public.sku_counters (tipo, last_value) values (p_tipo, 1)
  on conflict (tipo) do update set last_value = public.sku_counters.last_value + 1, updated_at = now()
  returning last_value into v_next;
  return p_tipo || '-' || p_pais || '-' || p_acabado || '-' || lpad(v_next::text, 3, '0');
end;
$fn$;
revoke all on function public.next_product_sku(text,text,text) from public, anon;
grant execute on function public.next_product_sku(text,text,text) to authenticated, service_role;
create or replace function public.validate_new_product_sku()
returns trigger
language plpgsql
set search_path to ''
as $fn$
begin
  if new.sku !~ '^[A-Z]{3}-[A-Z]{2}-[A-Z]{2}-[0-9]{3,}$' then
    raise exception 'SKU "%" no cumple la regla TIPO-PAÍS-ACABADO-NNN', new.sku;
  end if;
  return new;
end;
$fn$;
drop trigger if exists products_validate_new_sku on public.products;
create trigger products_validate_new_sku before insert on public.products for each row execute function public.validate_new_product_sku();
commit;