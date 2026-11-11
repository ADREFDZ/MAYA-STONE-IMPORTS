"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { submitContactAction } from "@/app/[lang]/contacto/actions";
import { track } from "@/lib/analytics/track";
import BranchLocations, {
  BranchLocationsDict,
} from "@/components/contact/BranchLocations";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { fillTemplate } from "@/lib/utils/strings";

export type ContactReason = "showroom" | "samples" | "quote" | "other";

// Tipo de cliente: MISMOS códigos que el CRM de MAYA (crm_options · tipo_cliente).
// Se guarda en profile_type y se envía tal cual al CRM.
const PROFILE_VALUES = [
  "arquitecto",
  "interiorista",
  "desarrollador",
  "marmolero",
  "cliente_final",
  "comercializadora",
  "otro",
] as const;

// Opciones fijas de "Línea de interés" (además de cada colección activa)
const FIXED_CATEGORY_VALUES = ["wood", "bespoke", "other"] as const;

export interface ContactCollectionOption {
  value: string;
  label: string;
}

interface ContactClientProps {
  lang: "es" | "en";
  /** Colecciones activas (se agregan solas al crear nuevas en admin) */
  collections: ContactCollectionOption[];
  dict: {
    meta: string;
    title: string;
    subtitle: string;
    form: {
      reason_label: string;
      reason_options: Record<string, string>;
      name_label: string;
      name_placeholder: string;
      email_label: string;
      email_placeholder: string;
      phone_label: string;
      phone_placeholder: string;
      company_label: string;
      company_placeholder: string;
      location_label: string;
      location_placeholder: string;
      project_label: string;
      project_placeholder: string;
      profile_label: string;
      profile_placeholder: string;
      profile_options: Record<string, string>;
      date_label: string;
      time_label: string;
      time_options: Record<string, string>;
      category_label: string;
      category_options: Record<string, string>;
      details_label: string;
      details_placeholder_showroom: string;
      details_placeholder_quote: string;
      /** Mensaje precargado al llegar desde "Solicitar catálogo" ({collection}) */
      catalog_request_message: string;
      /** Mensaje precargado desde "Consultar disponibilidad" ({material}) */
      material_request_message: string;
      /** Mensaje precargado desde el CTA de una obra ({project}) */
      project_request_message: string;
      submit: string;
      submitting: string;
      privacy_notice_prefix: string;
      privacy_notice_link: string;
      terms_notice_link: string;
      terms_notice_connector: string;
      privacy_notice_suffix: string;
    };
    success: {
      title: string;
      message: string;
    };
    error_default: string;
    showroom_image_alt: string;
    cards: {
      whatsapp_title: string;
      whatsapp_text: string;
      whatsapp_button: string;
      /** Número en formato internacional sin "+" ni espacios (wa.me) */
      whatsapp_number: string;
      whatsapp_message: string;
      phone_title: string;
      phone_value: string;
      hours_title: string;
      hours_value: string;
      email_title: string;
      email_value: string;
    };
    branches: BranchLocationsDict;
  };
}

export default function ContactClient({
  lang,
  dict,
  collections,
}: ContactClientProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<ContactReason>("quote");

  // Anti-spam: momento en que se montó el formulario (ver contacto/actions.ts)
  const formStartedAt = useRef(0);
  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);

  const searchParams = useSearchParams();
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  // Mensaje precargado según desde dónde llega la persona:
  // ?catalogo=<colección> · ?material=<material> · ?project=<obra>
  const readParam = (key: string) =>
    (searchParams.get(key) || "").trim().slice(0, 80);
  const catalogRequest = readParam("catalogo");
  const materialRequest = readParam("material");
  const projectRequest = readParam("project");
  const prefilledMessage = catalogRequest
    ? fillTemplate(dict.form.catalog_request_message, {
        collection: catalogRequest,
      })
    : materialRequest
      ? fillTemplate(dict.form.material_request_message, {
          material: materialRequest,
        })
      : projectRequest
        ? fillTemplate(dict.form.project_request_message, {
            project: projectRequest,
          })
        : "";

  // Línea de interés precargada (?category=bespoke o ?category=<colección>)
  const categoryParam = readParam("category").toLowerCase();
  const validCategories: string[] = [
    ...collections.map((c) => c.value),
    ...FIXED_CATEGORY_VALUES,
  ];
  const initialCategory = validCategories.includes(categoryParam)
    ? categoryParam
    : "";

  useEffect(() => {
    const queryReason =
      searchParams.get("reason") ||
      searchParams.get("type") ||
      (searchParams.get("catalogo") ? "other" : null);
    if (!queryReason) return;

    // Enlaces antiguos (consulting, bespoke, project, arquitectura) se
    // tratan como cotización, la única consulta de material del formulario.
    const normalized = queryReason.toLowerCase().trim();
    if (
      [
        "quote",
        "cotizacion",
        "project",
        "consulting",
        "bespoke",
        "arquitectura",
      ].includes(normalized)
    ) {
      setReason("quote");
    } else if (["samples", "muestra", "muestras"].includes(normalized)) {
      setReason("samples");
    } else if (["showroom", "visita"].includes(normalized)) {
      setReason("showroom");
    } else if (normalized === "other") {
      setReason("other");
    }
  }, [searchParams]);

  // Enlace directo a WhatsApp Business con un mensaje inicial
  const whatsappUrl = `https://wa.me/${dict.cards.whatsapp_number}?text=${encodeURIComponent(dict.cards.whatsapp_message)}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("form_started_at", String(formStartedAt.current));
    formData.set("lang", currentLocale);
    const res = await submitContactAction(formData);

    if (res.success) {
      track("lead", {
        reason: String(formData.get("contact_reason") || ""),
        client_type: String(formData.get("profile_type") || ""),
      });
      setSubmitted(true);
    } else {
      setError(res.error || dict.error_default);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-black-neutral pt-24 sm:pt-28 md:pt-36 pb-16 sm:pb-24 font-sans selection:bg-accent selection:text-white overflow-x-clip">
      <div className="editorial-container space-y-12 sm:space-y-16 lg:space-y-24">
        {/* 1. ENCABEZADO EDITORIAL */}
        <header className="border-b border-border-light pb-8 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-end">
            <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">
              <SectionLabel variant="minimal" theme="accent">
                {dict.meta}
              </SectionLabel>

              <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-black-neutral leading-tight text-balance">
                {dict.title}
              </h1>
            </div>

            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-light pt-4 lg:pt-0 lg:pl-8 pb-1">
              <p className="font-sans font-light text-maya-small sm:text-maya-body text-black-neutral/75 leading-relaxed">
                {dict.subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* 2. PLIEGO PRINCIPAL (FORMULARIO EDITORIAL & FOTOGRAFÍA) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 bg-surface border border-border-light p-5 sm:p-8 lg:p-12 flex flex-col justify-between rounded-2xs shadow-2xs">
            {submitted ? (
              <div className="my-auto py-12 sm:py-16 space-y-4 text-center animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-mono text-maya-body mx-auto shadow-xs">
                  ✓
                </div>
                <h2 className="font-sans font-light tracking-editorial text-maya-h3 sm:text-maya-h2 text-black-neutral uppercase">
                  {dict.success.title}
                </h2>
                <p className="font-sans text-maya-small sm:text-maya-body text-black-neutral/75 font-light max-w-md mx-auto leading-relaxed">
                  {dict.success.message}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="relative space-y-5 sm:space-y-6"
              >
                {/* Anti-spam (honeypot): invisible para personas, los bots lo llenan */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-0 h-px w-px opacity-0"
                />
                {/* Material de interés (si llegó desde "Consultar disponibilidad") */}
                {materialRequest && (
                  <input
                    type="hidden"
                    name="material_interest"
                    value={materialRequest}
                  />
                )}
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-maya-small font-mono uppercase tracking-data rounded-3xs">
                    {error}
                  </div>
                )}

                {/* MOTIVO DE CONTACTO */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-contact_reason" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                    {dict.form.reason_label}
                  </label>
                  <select
                    id="contact-contact_reason"
                    name="contact_reason"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ContactReason)}
                    className="w-full bg-accent-soft border border-border-light rounded-3xs pl-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer select-chevron shadow-2xs"
                  >
                    <option value="showroom">
                      {dict.form.reason_options.showroom}
                    </option>
                    <option value="samples">
                      {dict.form.reason_options.samples}
                    </option>
                    <option value="quote">
                      {dict.form.reason_options.quote}
                    </option>
                    <option value="other">
                      {dict.form.reason_options.other}
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* NOMBRE */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.name_label}
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      required
                      placeholder={dict.form.name_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* CORREO */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.email_label}
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      required
                      placeholder={dict.form.email_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* TELÉFONO */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.phone_label}
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      required
                      placeholder={dict.form.phone_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* EMPRESA / FIRMA */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-company" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.company_label}
                    </label>
                    <input
                      type="text"
                      id="contact-company"
                      name="company"
                      placeholder={dict.form.company_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* UBICACIÓN DEL PROYECTO (asigna al vendedor de la región en el CRM) */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-location" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.location_label}
                    </label>
                    <input
                      type="text"
                      id="contact-location"
                      name="location"
                      required
                      maxLength={120}
                      autoComplete="address-level2"
                      placeholder={dict.form.location_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* NOMBRE DEL PROYECTO */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-project_name" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.project_label}
                    </label>
                    <input
                      type="text"
                      id="contact-project_name"
                      name="project_name"
                      maxLength={120}
                      placeholder={dict.form.project_placeholder}
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                    />
                  </div>

                  {/* TIPO DE CLIENTE (mismas opciones que el CRM) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="contact-profile_type" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.profile_label}
                    </label>
                    <select
                      id="contact-profile_type"
                      name="profile_type"
                      required
                      defaultValue=""
                      className="w-full bg-accent-soft border border-border-light rounded-3xs pl-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer select-chevron shadow-2xs"
                    >
                      <option value="" disabled>
                        {dict.form.profile_placeholder}
                      </option>
                      {PROFILE_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {dict.form.profile_options[value]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CAMPOS CONDICIONALES PARA SHOWROOM */}
                  {reason === "showroom" && (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="contact-preferred_date" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                          {dict.form.date_label}
                        </label>
                        <input
                          type="date"
                          id="contact-preferred_date"
                          name="preferred_date"
                          className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="contact-preferred_time" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                          {dict.form.time_label}
                        </label>
                        <select
                          id="contact-preferred_time"
                          name="preferred_time"
                          defaultValue="morning"
                          className="w-full bg-accent-soft border border-border-light rounded-3xs pl-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer select-chevron shadow-2xs"
                        >
                          <option value="morning">
                            {dict.form.time_options.morning}
                          </option>
                          <option value="afternoon">
                            {dict.form.time_options.afternoon}
                          </option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* CAMPOS CONDICIONALES PARA COTIZACIÓN O MUESTRAS */}
                  {(reason === "quote" || reason === "samples") && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="contact-category_interest" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                        {dict.form.category_label}
                      </label>
                      <select
                        id="contact-category_interest"
                        name="category_interest"
                        key={initialCategory}
                        defaultValue={initialCategory}
                        className="w-full bg-accent-soft border border-border-light rounded-3xs pl-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer select-chevron shadow-2xs"
                      >
                        <option value="">
                          {dict.form.category_options.placeholder}
                        </option>
                        {collections.map((col) => (
                          <option key={col.value} value={col.value}>
                            {col.label}
                          </option>
                        ))}
                        {FIXED_CATEGORY_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {dict.form.category_options[value]}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* DETALLES DEL PROYECTO O MENSAJE */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-project_details" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                    {dict.form.details_label}
                  </label>
                  <textarea
                    id="contact-project_details"
                    name="project_details"
                    key={prefilledMessage || "details"}
                    defaultValue={prefilledMessage || undefined}
                    rows={4}
                    placeholder={
                      reason === "showroom"
                        ? dict.form.details_placeholder_showroom
                        : dict.form.details_placeholder_quote
                    }
                    className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral placeholder:text-black-neutral/35 focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all resize-none shadow-2xs"
                  />
                </div>

                <div className="pt-2 space-y-2.5">
                  <Button
                    type="submit"
                    variant="dark"
                    size="md"
                    fullWidth
                    disabled={loading}
                    icon={<span>→</span>}
                    iconPosition="right"
                  >
                    {loading ? dict.form.submitting : dict.form.submit}
                  </Button>

                  <p className="font-sans text-[11px] text-black-neutral/50 text-center leading-relaxed">
                    {dict.form.privacy_notice_prefix}
                    <Link
                      href={`/${ROUTES.privacidad[currentLocale]}`}
                      target="_blank"
                      className="text-accent-ink underline hover:text-black-neutral transition-colors"
                    >
                      {dict.form.privacy_notice_link}
                    </Link>
                    {dict.form.terms_notice_connector}
                    <Link
                      href={`/${ROUTES.terminos[currentLocale]}`}
                      target="_blank"
                      className="text-accent-ink underline hover:text-black-neutral transition-colors"
                    >
                      {dict.form.terms_notice_link}
                    </Link>
                    {dict.form.privacy_notice_suffix}
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* FOTOGRAFÍA EDITORIAL DE SHOWROOM
              Sin min-h en celular/tablet: junto con aspect-ratio forzaba un
              ancho mayor al del contenedor y la foto se salía por la derecha. */}
          <div className="lg:col-span-5 relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-auto lg:min-h-full bg-surface overflow-hidden border border-border-light rounded-2xs group shadow-2xs">
            <Image
              src="/images/Recepcion.jpg"
              alt={dict.showroom_image_alt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center group-hover:scale-103 transition-transform duration-1000 ease-out brightness-[0.95]"
            />
            <div className="absolute inset-0 bg-black-neutral/10 pointer-events-none" />
          </div>
        </section>

        {/* 3. WHATSAPP BUSINESS (CANAL DIRECTO DESTACADO) */}
        <section className="relative overflow-hidden rounded-2xs border border-gray-warm/15 bg-black-neutral text-gray-warm p-6 sm:p-10 lg:p-12 shadow-xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
            <div className="space-y-2 max-w-2xl">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {dict.cards.whatsapp_title}
              </span>
              <p className="font-mono text-maya-h4 sm:text-maya-h3 uppercase tracking-data text-white font-light">
                {dict.cards.phone_value}
              </p>
              <p className="font-sans text-maya-small sm:text-maya-body text-gray-warm/75 font-light leading-relaxed">
                {dict.cards.whatsapp_text}
              </p>
            </div>
            <div className="shrink-0">
              <Button
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline-light"
                size="lg"
                icon={<span>→</span>}
                iconPosition="right"
                className="hover:border-accent hover:text-white transition-all w-full sm:w-auto"
              >
                {dict.cards.whatsapp_button}
              </Button>
            </div>
          </div>
        </section>

        {/* 4. METADATOS Y TARJETAS DE INFORMACIÓN */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4">
          <div className="bg-surface border border-border-light rounded-2xs p-6 sm:p-8 text-center space-y-2 shadow-2xs">
            <span className="block font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
              {dict.cards.phone_title}
            </span>
            <p className="font-mono text-maya-small text-black-neutral tracking-data uppercase font-medium">
              {dict.cards.phone_value}
            </p>
          </div>

          <div className="bg-surface border border-border-light rounded-2xs p-6 sm:p-8 text-center space-y-2 shadow-2xs">
            <span className="block font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
              {dict.cards.hours_title}
            </span>
            <p className="font-sans text-maya-small text-black-neutral font-light">
              {dict.cards.hours_value}
            </p>
          </div>

          <div className="bg-surface border border-border-light rounded-2xs p-6 sm:p-8 text-center space-y-2 sm:col-span-2 md:col-span-1 shadow-2xs">
            <span className="block font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
              {dict.cards.email_title}
            </span>
            <p className="font-mono text-maya-small text-black-neutral tracking-data uppercase font-medium">
              {dict.cards.email_value}
            </p>
          </div>
        </section>

        {/* 5. SUCURSALES Y MAPA INTERACTIVO */}
        <section className="pt-8 sm:pt-12 border-t border-border-light">
          <BranchLocations dict={dict.branches} />
        </section>
      </div>
    </div>
  );
}
