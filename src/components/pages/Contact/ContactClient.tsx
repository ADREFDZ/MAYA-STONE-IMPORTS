"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { submitContactAction } from "@/app/[lang]/contacto/actions";
import BranchLocations, {
  BranchLocationsDict,
} from "@/components/contact/BranchLocations";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

export type ContactReason =
  | "showroom"
  | "quote"
  | "samples"
  | "consulting"
  | "other";

interface ContactClientProps {
  lang: "es" | "en";
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
      profile_label: string;
      profile_options: Record<string, string>;
      date_label: string;
      time_label: string;
      time_options: Record<string, string>;
      category_label: string;
      category_options: Record<string, string>;
      details_label: string;
      details_placeholder_showroom: string;
      details_placeholder_quote: string;
      submit_showroom: string;
      submit_general: string;
      submitting: string;
      privacy_notice_prefix?: string;
      privacy_notice_link?: string;
      terms_notice_link?: string;
      privacy_notice_suffix?: string;
    };
    success: {
      title: string;
      message: string;
    };
    error_default: string;
    cards: {
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

export default function ContactClient({ lang, dict }: ContactClientProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<ContactReason>("showroom");

  // Anti-spam: momento en que se montó el formulario (ver contacto/actions.ts)
  const formStartedAt = useRef(0);
  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);

  const searchParams = useSearchParams();
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  useEffect(() => {
    const queryReason = searchParams.get("reason") || searchParams.get("type");
    if (!queryReason) return;

    const normalized = queryReason.toLowerCase().trim();
    if (normalized === "project" || normalized === "quote") {
      setReason("quote");
    } else if (
      normalized === "samples" ||
      normalized === "muestra" ||
      normalized === "muestras"
    ) {
      setReason("samples");
    } else if (normalized === "consulting" || normalized === "bespoke") {
      setReason("consulting");
    } else if (normalized === "showroom" || normalized === "visita") {
      setReason("showroom");
    } else if (normalized === "other") {
      setReason("other");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("form_started_at", String(formStartedAt.current));
    const res = await submitContactAction(formData);

    if (res.success) {
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
                    className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer appearance-none shadow-2xs"
                  >
                    <option value="showroom">
                      {dict.form.reason_options.showroom}
                    </option>
                    <option value="quote">
                      {dict.form.reason_options.quote}
                    </option>
                    <option value="consulting">
                      {dict.form.reason_options.consulting}
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

                  {/* PERFIL PROFESIONAL */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="contact-profile_type" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                      {dict.form.profile_label}
                    </label>
                    <select
                      id="contact-profile_type"
                      name="profile_type"
                      required
                      defaultValue="architect"
                      className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer appearance-none shadow-2xs"
                    >
                      <option value="architect">
                        {dict.form.profile_options.architect}
                      </option>
                      <option value="developer">
                        {dict.form.profile_options.developer}
                      </option>
                      <option value="private">
                        {dict.form.profile_options.private}
                      </option>
                      <option value="other">
                        {dict.form.profile_options.other}
                      </option>
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
                          className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer appearance-none shadow-2xs"
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

                  {/* CAMPOS CONDICIONALES PARA COTIZACIÓN O ASESORÍA */}
                  {(reason === "quote" || reason === "consulting") && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="contact-category_interest" className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-medium">
                        {dict.form.category_label}
                      </label>
                      <select
                        id="contact-category_interest"
                        name="category_interest"
                        defaultValue="all"
                        className="w-full bg-accent-soft border border-border-light rounded-3xs px-3.5 py-2.5 font-sans text-maya-body text-black-neutral focus:bg-background focus:border-black-neutral focus-visible:ring-1 focus-visible:ring-accent transition-all cursor-pointer appearance-none shadow-2xs"
                      >
                        <option value="all">
                          {dict.form.category_options.all}
                        </option>
                        <option value="stone">
                          {dict.form.category_options.stone}
                        </option>
                        <option value="wood">
                          {dict.form.category_options.wood}
                        </option>
                        <option value="bespoke">
                          {dict.form.category_options.bespoke}
                        </option>
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
                    {loading
                      ? dict.form.submitting
                      : reason === "showroom"
                        ? dict.form.submit_showroom
                        : dict.form.submit_general}
                  </Button>

                  <p className="font-sans text-[11px] text-black-neutral/50 text-center leading-relaxed">
                    {dict.form.privacy_notice_prefix ||
                      (currentLocale === "es"
                        ? "Al enviar este formulario aceptas nuestro "
                        : "By submitting this form you agree to our ")}
                    <Link
                      href={`/${ROUTES.privacidad[currentLocale]}`}
                      target="_blank"
                      className="text-accent-ink underline hover:text-black-neutral transition-colors"
                    >
                      {dict.form.privacy_notice_link ||
                        (currentLocale === "es"
                          ? "Aviso de Privacidad"
                          : "Privacy Policy")}
                    </Link>
                    {currentLocale === "es" ? " y los " : " and "}
                    <Link
                      href={`/${ROUTES.terminos[currentLocale]}`}
                      target="_blank"
                      className="text-accent-ink underline hover:text-black-neutral transition-colors"
                    >
                      {dict.form.terms_notice_link ||
                        (currentLocale === "es"
                          ? "Términos y Condiciones"
                          : "Terms & Conditions")}
                    </Link>
                    {dict.form.privacy_notice_suffix || "."}
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* FOTOGRAFÍA EDITORIAL DE SHOWROOM */}
          <div className="lg:col-span-5 relative aspect-4/3 sm:aspect-16/10 lg:aspect-auto min-h-[280px] sm:min-h-[380px] lg:min-h-full bg-surface overflow-hidden border border-border-light rounded-2xs group shadow-2xs">
            <Image
              src="/images/Recepcion.jpg"
              alt="MAYA Showroom"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center group-hover:scale-103 transition-transform duration-1000 ease-out brightness-[0.95]"
            />
            <div className="absolute inset-0 bg-black-neutral/10 pointer-events-none" />
          </div>
        </section>

        {/* 3. METADATOS Y TARJETAS DE INFORMACIÓN */}
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

        {/* 4. SUCURSALES Y MAPA INTERACTIVO */}
        <section className="pt-8 sm:pt-12 border-t border-border-light">
          <BranchLocations dict={dict.branches} />
        </section>
      </div>
    </div>
  );
}
