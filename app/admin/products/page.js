import { ConnectionError, PageHeader } from "@/components/admin/ui";
import ProductsManager from "@/components/admin/ProductsManager";
import { requireAdmin } from "@/lib/admin/session";
import { loadAdminProducts } from "@/lib/admin/data";

export const metadata = { title: "পণ্য ব্যবস্থাপনা | জাবালুন অ্যাডমিন" };

const CATEGORIES = [
  { id: "instant-ready-hijab", name: "ইনস্ট্যান্ট রেডি হিজাব" },
  { id: "khimar-plazu-set", name: "খিমার প্লাজু সেট" },
];

export default async function AdminProductsPage() {
  await requireAdmin();
  const data = await loadAdminProducts();

  return (
    <>
      <PageHeader
        title="পণ্য ব্যবস্থাপনা"
        description="নতুন পণ্য যোগ করুন, দাম, ছবি, বিবরণ এবং স্টক সম্পাদনা করুন"
      />
      {data.error ? (
        <ConnectionError message={data.error} />
      ) : (
        <ProductsManager initialProducts={data.products} categories={CATEGORIES} />
      )}
    </>
  );
}
