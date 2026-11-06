import { MockBadge, PageHeader } from "@/components/admin/ui";
import DiscountsManager from "@/components/admin/DiscountsManager";
import { CATEGORIES, DISCOUNT_RULE } from "@/lib/admin/mock-data";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "ক্যাটাগরি ও ছাড়" };

export default async function AdminDiscountsPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="ক্যাটাগরি ও ছাড়" description="পণ্যের ক্যাটাগরি আর ছাড়ের নিয়ম" actions={<MockBadge />} />
      <DiscountsManager initialCategories={CATEGORIES} initialRule={DISCOUNT_RULE} />
    </>
  );
}
