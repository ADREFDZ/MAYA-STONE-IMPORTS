-- Quita la sincronizacion de inventario antigua (ya no se usa).
-- 1) Funcion que marcaba como agotados los productos no sincronizados
drop function if exists public.mark_out_of_stock_products(timestamp with time zone);
-- 2) Columna que solo usaba esa sincronizacion
alter table public.products drop column if exists last_synced_at;
