import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import UsersManagerClient from "./UsersManagerClient";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function UsersPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Consultar todos los perfiles registrados
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminLayout lang={resolvedParams.lang}>
      <div className="space-y-8 font-sans">
        <div className="border-b border-border-light pb-4 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            MÓDULO DE CONTROL
          </span>
          <h2 className="font-sans font-light text-maya-h2 tracking-editorial text-black-neutral uppercase">
            GESTIÓN DE USUARIOS
          </h2>
          <p className="font-mono text-maya-small uppercase tracking-data text-black-neutral/60">
            Administración de accesos, roles y credenciales de la plataforma
          </p>
        </div>

        <UsersManagerClient initialUsers={profiles || []} />
      </div>
    </AdminLayout>
  );
}
