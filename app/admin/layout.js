// ⚠️ প্রোডাকশনে যাওয়ার আগে লগইন সুরক্ষা যোগ করতে হবে।
// /admin is currently open to anyone who knows the URL. It shows sample data only and is
// not linked from the public site, but authentication must be added before real use.
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "অ্যাডমিন | জাবালুন", template: "%s | জাবালুন অ্যাডমিন" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
