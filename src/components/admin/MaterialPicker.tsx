"use client";

import { useMemo, useState } from "react";

export interface MaterialOption {
  sku: string;
  name: string;
  image: string | null;
  stone_type: string | null;
  origin: string | null;
  active: boolean;
  collections: { slug: string; title: string }[];
}

interface Props {
  options: MaterialOption[];
  selected: string[];
  onChange: (skus: string[]) => void;
}

const norm = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Selector de materiales del inventario (para "Materiales usados en el
 * proyecto"). Busca por nombre/SKU, filtra por colección y tipo de piedra y
 * conserva el orden en que se eligen.
 */
export default function MaterialPicker({ options, selected, onChange }: Props) {
  const [q, setQ] = useState("");
  const [collection, setCollection] = useState("all");
  const [stone, setStone] = useState("all");
  const [onlySelected, setOnlySelected] = useState(false);

  const bySku = useMemo(() => new Map(options.map((o) => [o.sku, o])), [options]);

  const collections = useMemo(() => {
    const m = new Map<string, string>();
    options.forEach((o) => o.collections.forEach((c) => m.set(c.slug, c.title)));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [options]);
  const stones = useMemo(
    () =>
      [...new Set(options.map((o) => o.stone_type).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [options],
  );

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return options.filter((o) => {
      if (onlySelected && !selected.includes(o.sku)) return false;
      if (collection !== "all" && !o.collections.some((c) => c.slug === collection)) return false;
      if (stone !== "all" && o.stone_type !== stone) return false;
      if (nq && !norm(`${o.name} ${o.sku} ${o.stone_type ?? ""} ${o.origin ?? ""}`).includes(nq))
        return false;
      return true;
    });
  }, [options, q, collection, stone, onlySelected, selected]);

  const toggle = (sku: string) =>
    onChange(selected.includes(sku) ? selected.filter((s) => s !== sku) : [...selected, sku]);

  const field =
    "px-2.5 py-2 text-maya-small border border-border-light bg-surface-secondary/60 focus:outline-none focus:border-black-neutral";

  return (
    <div className="space-y-5 font-sans">
      {/* SELECCIONADOS (en orden) */}
      <div className="space-y-2">
        <p className="text-maya-small text-black-neutral">
          Materiales usados en este proyecto{" "}
          <span className="text-text-muted">({selected.length})</span>
        </p>
        {selected.length === 0 ? (
          <p className="text-[12px] text-text-secondary">
            Ninguno. Si no eliges materiales, la sección no aparece en el sitio.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((sku) => {
              const o = bySku.get(sku);
              return (
                <li
                  key={sku}
                  className={`flex items-center gap-2 border pl-1 pr-2 py-1 text-[12px] ${
                    !o ? "border-amber-600/50 bg-amber-50" : "border-black-neutral bg-surface"
                  }`}
                >
                  {o?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.image} alt="" className="h-6 w-6 object-cover" />
                  )}
                  <span>{o ? o.name : `${sku} (no existe en el inventario)`}</span>
                  {o && !o.active && <span className="text-amber-800">· oculto</span>}
                  <button
                    type="button"
                    onClick={() => toggle(sku)}
                    aria-label={`Quitar ${o?.name ?? sku}`}
                    className="ml-1 text-text-muted hover:text-red-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar material o SKU…"
          aria-label="Buscar material"
          className={field}
        />
        <select value={collection} onChange={(e) => setCollection(e.target.value)} aria-label="Colección" className={`${field} select-chevron cursor-pointer`}>
          <option value="all">Todas las colecciones</option>
          {collections.map(([slug, title]) => (
            <option key={slug} value={slug}>
              {title}
            </option>
          ))}
        </select>
        <select value={stone} onChange={(e) => setStone(e.target.value)} aria-label="Tipo de piedra" className={`${field} select-chevron cursor-pointer`}>
          <option value="all">Todos los tipos</option>
          {stones.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer px-1">
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
          Solo elegidos
        </label>
      </div>

      {/* MATERIALES DISPONIBLES */}
      {list.length === 0 ? (
        <p className="text-maya-small text-text-secondary py-6 text-center">
          Ningún material coincide con la búsqueda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
          {list.map((o) => {
            const on = selected.includes(o.sku);
            return (
              <li key={o.sku}>
                <button
                  type="button"
                  onClick={() => toggle(o.sku)}
                  aria-pressed={on}
                  className={`group w-full text-left border transition-colors cursor-pointer ${
                    on ? "border-black-neutral ring-1 ring-black-neutral bg-surface" : "border-border-light hover:border-black-neutral/50"
                  }`}
                >
                  <span className="relative block aspect-[4/3] bg-surface-secondary overflow-hidden">
                    {o.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] text-text-muted">Sin foto</span>
                    )}
                    <span
                      aria-hidden="true"
                      className={`absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center text-[11px] border ${
                        on ? "bg-black-neutral text-gray-warm border-black-neutral" : "bg-white/80 border-border-light text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </span>
                  <span className="block px-2 py-1.5">
                    <span className="block text-[12px] text-black-neutral truncate">{o.name}</span>
                    <span className="block text-[11px] text-text-muted truncate">
                      {o.collections[0]?.title || "Sin colección"}
                      {o.active ? "" : " · oculto"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
