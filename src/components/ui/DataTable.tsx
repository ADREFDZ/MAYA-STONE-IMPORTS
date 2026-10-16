"use client";

import React, { ReactNode } from "react";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading = false,
  className = "",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-16 text-center font-mono text-maya-small tracking-data uppercase text-black-neutral/40">
        Cargando datos...
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto bg-surface border border-border-light rounded-2xs shadow-2xs ${className}`}
    >
      <table className="w-full text-left border-collapse font-sans text-maya-small min-w-[720px]">
        <thead>
          <tr className="bg-surface border-b border-border-light font-mono text-maya-label tracking-data uppercase text-black-neutral/70 font-semibold">
            {columns.map((col, idx) => (
              <th key={idx} className={`p-3.5 sm:p-4 ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="p-3.5 sm:p-4 text-right">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light bg-surface">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="p-8 text-center text-black-neutral/40 font-mono text-maya-small italic"
              >
                No se encontraron registros.
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="hover:bg-accent-soft/20 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`p-3.5 sm:p-4 text-maya-small text-black-neutral ${col.className || ""}`}
                  >
                    {typeof col.accessorKey === "function"
                      ? col.accessorKey(row)
                      : (row[col.accessorKey] as ReactNode)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="p-3.5 sm:p-4 text-right font-mono text-maya-label uppercase tracking-data">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 text-black-neutral bg-surface hover:bg-surface-secondary border border-border-light hover:border-black-neutral transition-colors cursor-pointer rounded-3xs shadow-2xs"
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="px-2.5 py-1.5 text-red-600 bg-surface border border-red-200 hover:bg-red-50 transition-colors cursor-pointer rounded-3xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
