"use client";

import { useState } from "react";

interface TagInputListProps {
  label: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  badgeStyle?: "default" | "slate" | "accent";
}

export default function TagInputList({
  label,
  placeholder = "Escribe y presiona Enter...",
  items = [],
  onChange,
  badgeStyle = "default",
}: TagInputListProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim();
    if (!clean) return;
    if (!items.includes(clean)) {
      onChange([...items, clean]);
    }
    setInputVal("");
  };

  const handleRemove = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  };

  const getBadgeClasses = () => {
    switch (badgeStyle) {
      case "accent":
        return "bg-accent-soft border-accent text-accent-ink font-semibold";
      default:
        return "bg-surface border-border-light text-black-neutral";
    }
  };

  return (
    <div className="space-y-2.5 font-sans">
      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd(e);
          }}
          className="flex-1 px-3.5 py-2.5 border border-accent/25 text-maya-body font-sans focus:outline-none focus:border-accent bg-accent-soft rounded-3xs placeholder:text-black-neutral/35"
        />
        <button
          type="button"
          onClick={(e) => handleAdd(e)}
          className="px-4 py-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data hover:bg-black-pure transition-colors cursor-pointer rounded-3xs shrink-0"
        >
          + Agregar
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-3xs font-mono text-maya-label uppercase tracking-data ${getBadgeClasses()}`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="opacity-50 hover:opacity-100 hover:text-red-600 font-bold cursor-pointer transition-opacity"
              >
                ✕
              </button>
            </span>
          ))
        ) : (
          <p className="font-mono text-maya-label text-black-neutral/40 italic">
            Sin elementos asignados.
          </p>
        )}
      </div>
    </div>
  );
}
