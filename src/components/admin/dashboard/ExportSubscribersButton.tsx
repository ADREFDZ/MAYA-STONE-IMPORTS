"use client";

import { useState } from "react";
import { exportSubscribersAction } from "@/app/[lang]/admin/dashboard/actions";

export default function ExportSubscribersButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    const res = await exportSubscribersAction();
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const blob = new Blob(["﻿" + res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maya-suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-black-neutral text-gray-warm font-mono text-maya-label tracking-data uppercase py-2.5 px-4 hover:bg-black-pure transition-colors disabled:opacity-60 cursor-pointer"
      >
        {busy ? "Generando…" : "Exportar CSV"}
      </button>
      {error && <p className="text-[12px] text-red-800">{error}</p>}
    </div>
  );
}
