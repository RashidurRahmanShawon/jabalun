import { ConnectionError, PageHeader } from "@/components/admin/ui";
import ProductsManager from "@/components/admin/ProductsManager";
import { requireAdmin } from "@/lib/admin/session";
import { loadAdminProducts, loadCategoryList } from "@/lib/admin/data";

export const metadata = { title: "পণ্য ব্যবস্থাপনা | জাবালুন অ্যাডমিন" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const [data, categories] = await Promise.all([loadAdminProducts(), loadCategoryList()]);

  return (
    <>
      <PageHeader
        title="পণ্য ব্যবস্থাপনা"
        description="নতুন পণ্য যোগ করুন, দাম, ছবি, বিবরণ এবং স্টক সম্পাদনা করুন"
      />
      {data.error || categories.error ? (
        <ConnectionError message={data.error || categories.error} />
      ) : (
        <ProductsManager initialProducts={data.products} categories={categories.list} />
      )}
    </>
  );
}
