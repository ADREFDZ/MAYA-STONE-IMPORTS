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
        <div className="border-b border-border-light pb-4 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral">
            Inventario
          </h1>
          <p className="text-maya-small text-text-secondary">
            {products.length} materiales registrados
          </p>
        </div>

        <div>
          <InventoryTable initialProducts={products} />
        </div>
      </div>
    </AdminLayout>
  );
}
