import { MockBadge, PageHeader } from "@/components/admin/ui";
import DeliverySettings from "@/components/admin/DeliverySettings";
import { DELIVERY_ZONES } from "@/lib/admin/mock-data";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "ডেলিভারি ও পেমেন্ট" };

export default async function AdminDeliveryPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="ডেলিভারি ও পেমেন্ট" description="পেমেন্ট পদ্ধতি, ডেলিভারি এলাকা ও চার্জ" actions={<MockBadge />} />
      <DeliverySettings initialZones={DELIVERY_ZONES} />
    </>
  );
}
