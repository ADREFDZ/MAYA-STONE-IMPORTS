"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  profile_type?: string;
  contact_reason: "showroom" | "quote" | "samples" | "consulting" | "other";
  category_interest?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  status: "nuevo" | "en_seguimiento" | "atendido" | "descartado";
  created_at: string;
}

interface Props {
  initialLeads: ContactLead[];
}

export default function LeadsManagerClient({ initialLeads }: Props) {
  const [leads, setLeads] = useState<ContactLead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeReasonFilter, setActiveReasonFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [messageTemplate, setMessageTemplate] = useState<string>("general");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  const supabase = createClient();

  const reasonLabels: Record<string, string> = {
    showroom: "Visita Showroom",
    quote: "Cotización",
    samples: "Muestras Físicas",
    consulting: "Consultoría",
    other: "Otro Asunto",
  };

  const categoryLabels: Record<string, string> = {
    all: "Catálogo General",
    stone: "Piedras Naturales",
    wood: "Maderas Nobles",
    bespoke: "Piezas Bespoke",
  };

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    if (!selectedLead) return;

    if (selectedLead.contact_reason === "showroom") {
      setMessageTemplate("showroom");
      setCustomSubject(`Confirmación de Cita Showroom - MAYA`);
      setCustomBody(
        `Hola ${selectedLead.name}, un gusto saludarte. Confirmamos la recepción de tu solicitud para visitar nuestro Showroom el día ${selectedLead.preferred_date || "programado"}. Quedamos a tu disposición para recibirte.`,
      );
    } else if (selectedLead.contact_reason === "samples") {
      setMessageTemplate("samples");
      setCustomSubject(`Coordinación de Envío de Muestras - MAYA`);
      setCustomBody(
        `Hola ${selectedLead.name}, recibimos tu solicitud de muestras físicas. Con gusto preparamos la selección de materiales para enviarla a tu despacho u oficina.`,
      );
    } else if (selectedLead.contact_reason === "quote") {
      setMessageTemplate("quote");
      setCustomSubject(`Cotización y Ficha Técnica - MAYA`);
      setCustomBody(
        `Estimado/a ${selectedLead.name}, recibimos tu solicitud de cotización para la línea de ${categoryLabels[selectedLead.category_interest || ""] || "nuestro catálogo"}. Con gusto podemos revisar los detalles de tu proyecto.`,
      );
    } else {
      setMessageTemplate("general");
      setCustomSubject(`Seguimiento a tu Consulta - MAYA`);
      setCustomBody(
        `Hola ${selectedLead.name}, te contactamos de MAYA con relación a tu mensaje. Quedamos atentos para asesorarte en la selección de materiales.`,
      );
    }
  }, [selectedLead]);

  const handleTemplateChange = (templateKey: string) => {
    setMessageTemplate(templateKey);
    if (!selectedLead) return;

    switch (templateKey) {
      case "showroom":
        setCustomSubject(`Confirmación de Cita Showroom - MAYA`);
        setCustomBody(
          `Hola ${selectedLead.name}, coordinemos los detalles para tu visita a nuestro Showroom el día ${selectedLead.preferred_date || "programado"}.`,
        );
        break;
      case "samples":
        setCustomSubject(`Envío de Muestras Físicas - MAYA`);
        setCustomBody(
          `Hola ${selectedLead.name}, tenemos listas las muestras de piedra natural para tu proyecto. ¿Podrías confirmarnos la dirección de entrega?`,
        );
        break;
      case "quote":
        setCustomSubject(`Información y Cotización B2B - MAYA`);
        setCustomBody(
          `Hola ${selectedLead.name}, hemos revisado tus requerimientos de materiales. Te comparto la información disponible para tu proyecto.`,
        );
        break;
      case "followup":
        setCustomSubject(`Seguimiento a Proyecto - MAYA`);
        setCustomBody(
          `Estimado/a ${selectedLead.name}, queremos dar seguimiento a tu solicitud para saber si requieres muestras de piedra o fichas técnicas adicionales.`,
        );
        break;
      default:
        setCustomSubject(`Atención de Solicitud - MAYA`);
        setCustomBody(
          `Hola ${selectedLead.name}, quedamos a tu disposición para asesorarte en la selección de materiales para tu obra.`,
        );
        break;
    }
  };

  const handleStatusChange = async (newStatus: ContactLead["status"]) => {
    if (!selectedLead) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from("contact_leads")
      .update({ status: newStatus })
      .eq("id", selectedLead.id);

    if (!error) {
      setLeads((prev) =>
        prev.map((item) =>
          item.id === selectedLead.id ? { ...item, status: newStatus } : item,
        ),
      );
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    } else {
      alert("Error al actualizar el estado");
    }
    setIsUpdating(false);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company &&
          lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone && lead.phone.includes(searchTerm));

      const matchesReason =
        activeReasonFilter === "all" ||
        lead.contact_reason === activeReasonFilter;

      const matchesStatus =
        activeStatusFilter === "all" || lead.status === activeStatusFilter;

      return matchesSearch && matchesReason && matchesStatus;
    });
  }, [leads, searchTerm, activeReasonFilter, activeStatusFilter]);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      showroom: leads.filter((l) => l.contact_reason === "showroom").length,
      quote: leads.filter((l) => l.contact_reason === "quote").length,
      samples: leads.filter((l) => l.contact_reason === "samples").length,
      consulting: leads.filter((l) => l.contact_reason === "consulting").length,
      other: leads.filter((l) => l.contact_reason === "other").length,
      nuevos: leads.filter((l) => l.status === "nuevo").length,
    };
  }, [leads]);

  const cleanPhoneForWhatsApp = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  const columns: Column<ContactLead>[] = [
    {
      header: "FECHA",
      accessorKey: (row) => (
        <span className="font-mono text-[10px] text-black-neutral/60">
          {new Date(row.created_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "CLIENTE / DESPACHO",
      accessorKey: (row) => (
        <div>
          <p className="font-sans font-medium text-maya-small text-black-neutral">
            {row.name}
          </p>
          {row.company && (
            <p className="font-mono text-maya-label text-black-neutral/50 uppercase">
              {row.company}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "CONTACTO",
      accessorKey: (row) => (
        <div>
          <p className="font-mono text-maya-small text-black-neutral/80">
            {row.email}
          </p>
          {row.phone && (
            <p className="font-mono text-maya-label text-black-neutral/50">
              {row.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "MOTIVO",
      accessorKey: (row) => (
        <span className="px-2.5 py-1 text-maya-label font-mono uppercase tracking-data bg-accent-soft text-accent-ink border border-accent/30 rounded-3xs font-semibold">
          {reasonLabels[row.contact_reason] || row.contact_reason}
        </span>
      ),
    },
    {
      header: "ESTADO",
      accessorKey: (row) => {
        const statusStyles = {
          nuevo: "bg-black-neutral text-gray-warm font-bold",
          en_seguimiento:
            "bg-amber-50 text-amber-900 border border-amber-200 font-medium",
          atendido:
            "bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium",
          descartado:
            "bg-surface text-black-neutral/40 border border-border-light",
        };

        return (
          <span
            className={`px-2.5 py-1 text-maya-label uppercase tracking-data font-mono rounded-3xs ${
              statusStyles[row.status] || "bg-surface text-black-neutral"
            }`}
          >
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      header: "ACCIONES",
      accessorKey: (row) => (
        <button
          type="button"
          onClick={() => setSelectedLead(row)}
          className="px-3 py-1.5 text-maya-label font-mono uppercase tracking-data text-black-neutral bg-surface hover:bg-surface-secondary border border-border-light hover:border-black-neutral transition-colors cursor-pointer rounded-3xs shadow-2xs"
        >
          Ver Ficha
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 border border-border-light rounded-2xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "Todos", count: counts.all },
            { key: "showroom", label: "Showroom", count: counts.showroom },
            { key: "quote", label: "Cotizaciones", count: counts.quote },
            { key: "samples", label: "Muestras", count: counts.samples },
            {
              key: "consulting",
              label: "Consultoría",
              count: counts.consulting,
            },
            { key: "other", label: "Otros", count: counts.other },
          ].map((tab) => {
            const isActive = activeReasonFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveReasonFilter(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 font-mono text-maya-label tracking-data uppercase transition-all cursor-pointer border rounded-3xs ${
                  isActive
                    ? "bg-black-neutral text-gray-warm border-black-neutral font-bold shadow-xs"
                    : "bg-surface text-black-neutral/70 border-border-light hover:border-black-neutral hover:bg-accent-soft/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1 py-px text-[9px] ${
                    isActive ? "text-accent-ink font-bold" : "text-black-neutral/40"
                  }`}
                >
                  [{tab.count}]
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <select
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-accent/25 font-mono text-maya-label bg-accent-soft text-black-neutral focus:outline-none focus:border-accent cursor-pointer uppercase rounded-3xs"
          >
            <option value="all">Todos los estados</option>
            <option value="nuevo">Nuevos ({counts.nuevos})</option>
            <option value="en_seguimiento">En Seguimiento</option>
            <option value="atendido">Atendidos</option>
            <option value="descartado">Descartados</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por cliente, empresa, mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-accent/25 text-maya-small font-sans focus:outline-none focus:border-accent bg-accent-soft text-black-neutral w-full sm:w-56 rounded-3xs placeholder:text-black-neutral/40"
          />
        </div>
      </div>

      <div className="bg-surface border border-border-light rounded-2xs shadow-2xs overflow-hidden">
        <DataTable columns={columns} data={filteredLeads} />
      </div>

      {/* Modal de Ficha */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Ficha del Prospecto B2B"
        className="max-w-5xl lg:max-w-6xl w-full"
      >
        {selectedLead && (
          <div className="font-sans text-maya-small space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8 p-1">
            {/* EXPEDIENTE */}
            <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-3 flex justify-between items-start">
                  <div>
                    <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
                      EXPEDIENTE ENTRANTE
                    </span>
                    <h3 className="font-sans font-medium text-maya-h3 text-black-neutral uppercase mt-0.5">
                      {selectedLead.name}
                    </h3>
                    {selectedLead.company && (
                      <p className="font-mono text-maya-small text-black-neutral/60 uppercase mt-0.5">
                        {selectedLead.company}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 text-maya-label uppercase tracking-data font-mono rounded-3xs border ${
                      selectedLead.status === "nuevo"
                        ? "bg-black-neutral text-gray-warm font-bold shadow-xs"
                        : selectedLead.status === "atendido"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}
                  >
                    {selectedLead.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-3.5 border border-border-light rounded-2xs shadow-2xs">
                  <div>
                    <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 block font-semibold">
                      Correo
                    </span>
                    <p className="font-mono text-black-neutral font-medium mt-0.5 select-all break-all text-maya-small">
                      {selectedLead.email}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 block font-semibold">
                      Teléfono
                    </span>
                    <p className="font-mono text-black-neutral font-medium mt-0.5 select-all text-maya-small">
                      {selectedLead.phone || "No registrado"}
                    </p>
                  </div>
                </div>

                {selectedLead.contact_reason === "showroom" &&
                  selectedLead.preferred_date && (
                    <div className="bg-amber-50/90 border border-amber-200 p-3.5 rounded-2xs space-y-1">
                      <span className="font-mono text-maya-label uppercase text-amber-900 tracking-data block font-bold">
                        Cita Programada para Showroom
                      </span>
                      <p className="font-mono font-bold text-black-neutral text-maya-body">
                        {selectedLead.preferred_date} (
                        {selectedLead.preferred_time === "morning"
                          ? "Mañana"
                          : "Tarde"}
                        )
                      </p>
                    </div>
                  )}

                {selectedLead.message && (
                  <div className="space-y-1">
                    <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 block font-semibold">
                      Mensaje / Especificación
                    </span>
                    <div className="text-maya-small text-black-neutral bg-accent-soft p-3.5 border border-accent/25 rounded-3xs leading-relaxed font-sans max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {selectedLead.message}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border-light pt-4 space-y-2">
                <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 font-semibold block">
                  Actualizar Etapa del Prospecto
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-maya-label">
                  {[
                    { id: "nuevo", label: "1. Nuevo" },
                    { id: "en_seguimiento", label: "2. Seguimiento" },
                    { id: "atendido", label: "3. Atendido" },
                    { id: "descartado", label: "✕ Descartar" },
                  ].map((step) => {
                    const isCurrent = selectedLead.status === step.id;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(step.id as ContactLead["status"])
                        }
                        className={`py-2 px-1 text-center uppercase tracking-data transition-all cursor-pointer border rounded-3xs ${
                          isCurrent
                            ? "bg-black-neutral text-gray-warm font-bold border-black-neutral shadow-xs"
                            : "bg-surface text-black-neutral/70 border-border-light hover:border-black-neutral hover:bg-accent-soft/40"
                        }`}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RESPUESTA RÁPIDA */}
            <div className="lg:col-span-7 space-y-4 lg:border-l lg:border-border-light lg:pl-8">
              <div className="border-b border-border-light pb-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                  Respuesta Comercial
                </span>

                <select
                  value={messageTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="px-3 py-1.5 border border-accent/25 font-mono text-maya-label bg-accent-soft text-black-neutral focus:outline-none focus:border-accent cursor-pointer rounded-3xs"
                >
                  <option value="showroom">Plantilla: Showroom</option>
                  <option value="quote">Plantilla: Cotización</option>
                  <option value="samples">Plantilla: Muestras Físicas</option>
                  <option value="followup">Plantilla: Seguimiento</option>
                  <option value="general">Plantilla: General</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-mono text-maya-label text-black-neutral/60 uppercase">
                    Asunto para Correo
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-accent-soft border border-accent/25 px-3.5 py-2.5 text-maya-small font-sans text-black-neutral focus:outline-none focus:border-accent rounded-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-maya-label text-black-neutral/60 uppercase">
                    Mensaje Sincronizado (WhatsApp / Email)
                  </label>
                  <textarea
                    rows={5}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full bg-accent-soft border border-accent/25 p-3 text-maya-small font-sans text-black-neutral focus:outline-none focus:border-accent resize-none leading-relaxed rounded-3xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-maya-label uppercase tracking-data">
                {selectedLead.phone ? (
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(selectedLead.phone)}?text=${encodeURIComponent(customBody)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white transition-colors rounded-3xs text-center font-semibold cursor-pointer shadow-xs"
                  >
                    WhatsApp ↗
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-4 bg-surface border border-border-light text-black-neutral/30 rounded-3xs text-center cursor-not-allowed"
                  >
                    Sin Teléfono
                  </button>
                )}

                <a
                  href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(customSubject)}&body=${encodeURIComponent(customBody)}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black-neutral hover:bg-black-pure text-gray-warm transition-colors rounded-3xs text-center font-semibold cursor-pointer shadow-xs"
                >
                  Enviar Correo ✉
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
