import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import { getInventorySummary } from "../inventory/actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalAdmins },
    { count: totalLeads },
    { data: recentLeads },
    { count: totalCollections },
    { count: totalGalleryPhotos },
    inventory,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin"),
    supabase.from("contact_leads").select("*", { count: "exact", head: true }),
    supabase
      .from("contact_leads")
      .select("id, name, email, contact_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("collections").select("*", { count: "exact", head: true }),
    supabase.from("gallery_photos").select("*", { count: "exact", head: true }),
    getInventorySummary(),
  ]);

  const formattedLastSync = inventory?.lastSync
    ? new Date(inventory.lastSync).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin registros";

  const inStockPercentage = inventory?.total
    ? Math.round(((inventory.active || 0) / inventory.total) * 100)
    : 0;

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 md:space-y-10 font-sans">
        {/* Encabezado Editorial */}
        <div className="border-b border-border-light pb-4 md:pb-6 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            SISTEMA DE GESTIÓN CENTRAL
          </span>
          <h2 className="font-sans font-light text-maya-h2 tracking-editorial text-black-neutral uppercase leading-tight">
            RESUMEN GENERAL
          </h2>
        </div>

        {/* Métricas Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Leads */}
          <div className="bg-surface p-5 md:p-6 border border-border-light flex flex-col justify-between space-y-4 rounded-2xs shadow-2xs">
            <div>
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                SOLICITUDES B2B
              </span>
              <p className="font-sans font-light text-3xl sm:text-4xl text-black-neutral mt-1">
                {totalLeads || 0}
              </p>
            </div>
            <Link
              href={`/${lang}/admin/leads`}
              className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 hover:text-accent-ink transition-colors border-t border-border-light pt-3 flex items-center justify-between"
            >
              <span>Gestionar Leads</span>
              <span>→</span>
            </Link>
          </div>

          {/* Inventario */}
          <div className="bg-surface p-5 md:p-6 border border-border-light flex flex-col justify-between space-y-4 rounded-2xs shadow-2xs">
            <div>
              <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 font-semibold block">
                CATÁLOGO Y STOCK
              </span>
              <p className="font-sans font-light text-3xl sm:text-4xl text-black-neutral mt-1">
                {inventory?.total || 0}{" "}
                <span className="font-mono text-maya-small text-black-neutral/40 uppercase">
                  SKUs
                </span>
              </p>
            </div>
            <p className="font-mono text-maya-label text-emerald-800 border-t border-border-light pt-3 truncate font-medium">
              ● {inventory?.active || 0} Materiales Activos
            </p>
          </div>

          {/* Colecciones */}
          <div className="bg-surface p-5 md:p-6 border border-border-light flex flex-col justify-between space-y-4 rounded-2xs shadow-2xs">
            <div>
              <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 font-semibold block">
                CONTENIDO CURADO
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <p className="font-sans font-light text-2xl sm:text-3xl text-black-neutral">
                  {totalCollections || 0}{" "}
                  <span className="font-mono text-maya-label text-black-neutral/40 uppercase">
                    Col.
                  </span>
                </p>
                <p className="font-sans font-light text-2xl sm:text-3xl text-black-neutral">
                  {totalGalleryPhotos || 0}{" "}
                  <span className="font-mono text-maya-label text-black-neutral/40 uppercase">
                    Fotos
                  </span>
                </p>
              </div>
            </div>
            <div className="font-mono text-maya-label text-black-neutral/50 border-t border-border-light pt-3 flex justify-between">
              <span>Módulos de Galería</span>
              <span className="text-accent-ink font-semibold">Activo</span>
            </div>
          </div>

          {/* Accesos */}
          <div className="bg-black-neutral text-gray-warm p-5 md:p-6 border border-black-neutral flex flex-col justify-between space-y-4 rounded-2xs shadow-xs">
            <div className="space-y-1">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                ACCESOS Y ESTADO
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-maya-small tracking-data text-gray-warm uppercase">
                  {totalUsers || 0} Usuarios ({totalAdmins || 0} Admins)
                </span>
              </div>
            </div>
            <div className="font-mono text-maya-label text-gray-warm/60 border-t border-gray-warm/15 pt-3 truncate">
              Sincronizado:{" "}
              <span className="text-gray-warm">{formattedLastSync}</span>
            </div>
          </div>
        </div>

        {/* Paneles de Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Stock */}
          <div className="lg:col-span-7 bg-surface border border-border-light p-6 md:p-8 space-y-6 md:space-y-8 rounded-2xs shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4 md:pb-6">
              <div>
                <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                  DISPONIBILIDAD DE CANTERA
                </span>
                <h3 className="font-sans font-light text-maya-h3 tracking-editorial text-black-neutral uppercase mt-1">
                  ESTADO DE STOCK PERMANENTE
                </h3>
              </div>

              <Link
                href={`/${lang}/admin/inventory`}
                className="inline-flex items-center justify-center gap-2 bg-black-neutral text-gray-warm font-mono text-maya-label tracking-data uppercase py-2.5 px-4 hover:bg-black-pure transition-colors shrink-0 rounded-3xs shadow-xs"
              >
                <span>GESTIONAR STOCK</span>
                <span className="text-accent-ink">→</span>
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-maya-label uppercase tracking-data">
                <span className="text-black-neutral/70">
                  PROPORCIÓN DISPONIBLE
                </span>
                <span className="font-semibold text-black-neutral">
                  {inStockPercentage}% ACTIVO
                </span>
              </div>
              <div className="w-full h-2 bg-accent-soft overflow-hidden flex rounded-full border border-border-light">
                <div
                  style={{ width: `${inStockPercentage}%` }}
                  className="h-full bg-black-neutral transition-all duration-1000"
                />
                <div
                  style={{ width: `${100 - inStockPercentage}%` }}
                  className="h-full bg-accent/40 transition-all duration-1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-2">
              <div className="p-4 border-l-2 border-black-neutral bg-surface space-y-1 rounded-r-3xs border border-border-light shadow-2xs">
                <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50 block font-semibold">
                  TOTAL SKUS
                </span>
                <p className="font-sans font-light text-2xl text-black-neutral">
                  {inventory?.total || 0}
                </p>
              </div>

              <div className="p-4 border-l-2 border-emerald-600 bg-surface space-y-1 rounded-r-3xs border border-emerald-500/20 shadow-2xs">
                <span className="font-mono text-maya-label uppercase tracking-data text-emerald-800/70 block font-semibold">
                  EN STOCK
                </span>
                <p className="font-sans font-light text-2xl text-emerald-900">
                  {inventory?.active || 0}
                </p>
              </div>

              <div className="p-4 border-l-2 border-amber-600 bg-surface space-y-1 rounded-r-3xs border border-amber-500/20 shadow-2xs">
                <span className="font-mono text-maya-label uppercase tracking-data text-amber-800/70 block font-semibold">
                  AGOTADOS
                </span>
                <p className="font-sans font-light text-2xl text-amber-900">
                  {inventory?.outOfStock || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="lg:col-span-5 bg-surface border border-border-light p-6 md:p-8 space-y-6 rounded-2xs shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-light pb-4 md:pb-6">
              <div>
                <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                  ACTIVIDAD RECIENTE
                </span>
                <h3 className="font-sans font-light text-maya-h3 tracking-editorial text-black-neutral uppercase mt-1">
                  ÚLTIMOS LEADS B2B
                </h3>
              </div>
              <Link
                href={`/${lang}/admin/leads`}
                className="font-mono text-maya-label uppercase tracking-data text-black-neutral/70 hover:text-accent-ink transition-colors font-semibold"
              >
                VER TODOS ↗
              </Link>
            </div>

            {recentLeads && recentLeads.length > 0 ? (
              <div className="divide-y divide-border-light">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-maya-small font-medium text-black-neutral">
                        {lead.name || "Sin nombre"}
                      </span>
                      <span className="font-mono text-maya-label text-black-neutral/40">
                        {new Date(lead.created_at).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-maya-label text-black-neutral/60 gap-2">
                      <span className="truncate max-w-[180px]">
                        {lead.email}
                      </span>
                      {lead.contact_reason && (
                        <span className="uppercase text-[9px] px-2 py-0.5 bg-accent-soft border border-accent/25 text-black-neutral shrink-0 rounded-3xs">
                          {lead.contact_reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-maya-small text-black-neutral/50 font-normal py-4 italic">
                No hay solicitudes de contacto recientes registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
