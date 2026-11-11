-- 2026-11-09: activa RLS en respaldos que estaban expuestos (sin políticas = solo service_role / panel)
ALTER TABLE public.backup_products_20261029 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_collection_products_20261029 ENABLE ROW LEVEL SECURITY;
