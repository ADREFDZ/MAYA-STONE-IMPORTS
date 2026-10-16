"use client";

import React, { useState } from "react";
import { BRANCHES, Branch } from "@/data/branches";
import Button from "@/components/ui/Button";

export interface BranchLocationsDict {
  location_label: string;
  address_label: string;
  hours_label: string;
  contact_label: string;
  maps_button: string;
}

interface BranchLocationsProps {
  className?: string;
  dict: BranchLocationsDict;
}

export default function BranchLocations({
  className = "",
  dict,
}: BranchLocationsProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch>(BRANCHES[0]);

  return (
    <div className={`space-y-6 sm:space-y-8 font-sans ${className}`}>
      {/* 1. SELECTOR DE SUCURSAL: DESLIZABLE EN MÓVIL SIN OVERFLOW */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-border-light w-full">
        {BRANCHES.map((branch) => {
          const isActive = selectedBranch.id === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => setSelectedBranch(branch)}
              className={`px-3.5 py-1.5 text-left font-mono text-maya-label uppercase tracking-data transition-all duration-300 cursor-pointer rounded-3xs shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                isActive
                  ? "bg-black-neutral text-gray-warm font-semibold shadow-xs"
                  : "bg-surface text-black-neutral/70 hover:text-black-neutral hover:border-black-neutral/40 border border-border-light"
              }`}
            >
              {branch.city}
            </button>
          );
        })}
      </div>

      {/* 2. TARJETA DE INFORMACIÓN Y MAPA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch">
        <div className="lg:col-span-5 bg-surface border border-border-light rounded-2xs p-5 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-5">
            <div className="space-y-1 border-b border-border-light pb-3">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {dict.location_label}
              </span>
              <h3 className="font-sans font-light tracking-editorial text-maya-h3 uppercase text-black-neutral leading-snug">
                {selectedBranch.name}
              </h3>
            </div>

            <div className="space-y-3.5 font-sans text-maya-small text-black-neutral/75">
              <div className="space-y-1">
                <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/40 font-medium">
                  {dict.address_label}
                </span>
                <p className="leading-relaxed font-light text-black-neutral/85">
                  {selectedBranch.address}
                </p>
              </div>

              <div className="space-y-1">
                <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/40 font-medium">
                  {dict.hours_label}
                </span>
                <p className="font-light">{selectedBranch.hours}</p>
              </div>

              <div className="space-y-1">
                <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/40 font-medium">
                  {dict.contact_label}
                </span>
                <p className="font-light">{selectedBranch.phone}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              href={selectedBranch.googleMapsDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline-dark"
              size="sm"
              fullWidth
              icon={<span>↗</span>}
              iconPosition="right"
            >
              {dict.maps_button}
            </Button>
          </div>
        </div>

        {/* MAPA EMBEBIDO CON PROPORCIÓN RESPONSIVE SEGURA */}
        <div className="lg:col-span-7 relative aspect-4/3 sm:aspect-16/10 lg:aspect-auto min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] rounded-2xs overflow-hidden border border-border-light bg-black-neutral/5 shadow-xs">
          <iframe
            key={selectedBranch.id}
            src={selectedBranch.googleMapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full grayscale-[0.7] contrast-[0.95] hover:grayscale-0 transition-all duration-700"
            title={selectedBranch.name}
          />
        </div>
      </div>
    </div>
  );
}
