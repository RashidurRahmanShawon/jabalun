import { ConnectionError, PageHeader } from "@/components/admin/ui";
import DiscountsManager from "@/components/admin/DiscountsManager";
import { DISCOUNT_RULE } from "@/lib/admin/mock-data";
import { loadCategoryList } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "ক্যাটাগরি ও ছাড়" };

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const categories = await loadCategoryList();
  return (
    <>
      <PageHeader title="ক্যাটাগরি ও ছাড়" description="পণ্যের ক্যাটাগরি আর ছাড়ের নিয়ম" />
      {categories.error ? (
        <ConnectionError message={categories.error} />
      ) : (
        <DiscountsManager initialCategories={categories.list} initialRule={DISCOUNT_RULE} />
      )}
    </>
  );
}
