import { MockBadge, PageHeader } from "@/components/admin/ui";
import SettingsForm from "@/components/admin/SettingsForm";
import { SITE, hasValue } from "@/lib/site";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "সেটিংস" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const store = {
    name: SITE.siteName,
    email: SITE.email,
    phone: hasValue(SITE.phone) ? SITE.phone : "",
    address: hasValue(SITE.address) ? SITE.address : "",
  };

  return (
    <>
      <PageHeader title="সেটিংস" description="দোকানের তথ্য, প্রোফাইল ও ট্র্যাকিং" actions={<MockBadge />} />
      <SettingsForm store={store} />
    </>
  );
}
