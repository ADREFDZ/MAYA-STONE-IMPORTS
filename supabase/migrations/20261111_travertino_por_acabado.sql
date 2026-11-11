-- 2026-11-11 · APLICADA en Supabase (migración "travertino_un_material_por_acabado")
-- Colección Travertino: Ivory y Terra con un material (SKU) por acabado:
--   Natural (CO), Sandblasteado (SA), Spazzolato (SP), Bambú (BA), Cepillado (CE),
--   Pulido mate (HO), Pulido brillado (PU), Busardeado (AB).
-- Ivory: TRV-MX-CO-001 (existente→Natural), SA-007, SP-008, BA-009, CE-010, HO-011, PU-012, AB-013
--        + Ivory Mosaico (CO-002), Ivory Versailles (CO-003), Ivory Brick (TU-004)
-- Terra: CO-014, SA-015, SP-016, BA-017, CE-018, HO-005 (existente→Pulido mate), PU-019, AB-020
-- Silver (TRV-AS-HO-006): status = 'inactive' (oculto, no borrado)
-- Respaldo: backups.travertino_products_20261111 y backups.travertino_collection_products_20261111

-- 2026-11-11 (2) · APLICADA ("travertino_familias_ivory_terra")
-- products.material_family (Ivory / Terra) para agrupar en la web.
-- "Natural" → "Natural Cut". Terra también en Mosaico (CO-021), Versailles (CO-022), Brick (TU-023).

-- 2026-11-11 (3) · APLICADA ("travertino_solo_ivory_terra") — VERSIÓN FINAL
-- La colección muestra solo Ivory (TRV-MX-CO-001) y Terra (TRV-MX-HO-005), cada uno con
-- 8 acabados y formatos: Placa, 60x120x2, 40xLLx1, Mosaico, Versailles, Brick, Personalizado.
-- Las variantes por acabado/formato (SA-007…TU-023, CO-002, CO-003, TU-004) quedaron status='inactive'.
-- material_family quedó sin uso (todo en NULL).
