import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import LeadsManagerClient from "./LeadsManagerClient";
import { toTitleCase } from "@/lib/utils/strings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function LeadsAdminPage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const supabase = await createClient();

  const [{ data: leads, error }, { data: collections }] = await Promise.all([
    supabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false }),
    // Para mostrar el nombre de la colección elegida en "Línea de interés"
    supabase.from("collections").select("slug, title_es"),
  ]);

  const collectionLabels: Record<string, string> = Object.fromEntries(
    (collections || [])
      .filter((c) => c.slug)
      .map((c) => [c.slug as string, toTitleCase(c.title_es || c.slug)]),
  );

  if (error) {
    console.error("Error al obtener las solicitudes:", error.message);
  }

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 font-sans">
        <div className="border-b border-border-light pb-4 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            MÓDULO DE PROSPECTOS B2B
          </span>
          <h1 className="font-sans font-light text-maya-h2 tracking-editorial text-black-neutral uppercase">
            SOLICITUDES DE CONTACTO
          </h1>
          <p className="font-mono text-maya-small uppercase tracking-data text-black-neutral/60">
            Seguimiento de visitas a showroom, solicitudes de cotización y
            muestras físicas
          </p>
        </div>

        <LeadsManagerClient
          initialLeads={leads || []}
          collectionLabels={collectionLabels}
        />
      </div>
    </AdminLayout>
  );
}
