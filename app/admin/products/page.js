import { ConnectionError, PageHeader } from "@/components/admin/ui";
import ProductsTable from "@/components/admin/ProductsTable";
import { requireAdmin } from "@/lib/admin/session";
import { loadAdminProducts } from "@/lib/admin/data";

export const metadata = { title: "পণ্য" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const data = await loadAdminProducts();

  return (
    <>
      <PageHeader title="পণ্য" description="WooCommerce-এর সব পণ্য (প্রকাশিত, ড্রাফট ও প্রাইভেট)" />
      {data.error ? <ConnectionError message={data.error} /> : <ProductsTable products={data.products} />}
    </>
  );
}
