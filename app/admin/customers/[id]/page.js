import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Card, EmptyState, KpiCard, MockBadge, PageHeader } from "@/components/admin/ui";
import { CUSTOMERS, ORDER_STATUSES, ORDERS, customerSummary } from "@/lib/admin/mock-data";
import { date, dateTime, num, taka } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "গ্রাহকের বিস্তারিত" };

export default async function AdminCustomerDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) notFound();

  const summary = customerSummary(customer);
  // Purchase history includes cancelled orders, marked as such
  const history = ORDERS.filter((o) => o.customerId === customer.id);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> সব গ্রাহক
      </Link>
      <PageHeader title={customer.name} description={`${customer.phone} · ${customer.address}`} actions={<MockBadge />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="মোট অর্ডার" value={`${num(summary.orderCount)}টি`} hint="বাতিল ছাড়া" />
        <KpiCard label="মোট ব্যয়" value={taka(summary.totalSpent)} />
        <KpiCard label="শেষ অর্ডার" value={summary.lastOrder ? date(summary.lastOrder) : "—"} />
      </div>

      <Card title="ক্রয়ের ইতিহাস" className="mt-6">
        {history.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {history.map((order) => (
              <li key={order.id}>
                {/* Sample orders: not linked, the order pages now show real WooCommerce orders */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="font-semibold">#{order.id}</span>
                  <span className="text-sm text-neutral-500">{dateTime(order.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">
                    {order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                  </span>
                  <span className="font-semibold">{taka(order.total)}</span>
                  <Badge tone={ORDER_STATUSES[order.status].tone}>{ORDER_STATUSES[order.status].label}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="এই গ্রাহকের কোনো অর্ডার নেই" />
        )}
      </Card>
    </>
  );
}
