import { getProducts } from "./actions";
import AdminLayout from "@/components/admin/AdminLayout";
import InventoryTable from "./InventoryTable";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function InventoryPage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const products = await getProducts();

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 font-sans">
        {/* Encabezado */}
        <div className="border-b border-border-light pb-4 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            MÓDULO DE INVENTARIO
          </span>
          <h1 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral">
            CONTROL DE STOCK Y MATERIALES
          </h1>
          <p className="font-mono text-maya-small uppercase tracking-data text-black-neutral/60">
            Gestión y catálogo general de materiales
          </p>
        </div>

        {/* Tabla Interactiva */}
        <div className="space-y-4">
          <h2 className="font-sans font-light tracking-editorial text-maya-h3 text-black-neutral uppercase">
            Catálogo Actual ({products.length} SKUs)
          </h2>

          <InventoryTable initialProducts={products} />
        </div>
      </div>
    </AdminLayout>
  );
}
