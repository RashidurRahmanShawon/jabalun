import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Phone, StickyNote } from "lucide-react";
import { Badge, Card, ConnectionError, EmptyState, KpiCard, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import ClickableRow from "@/components/admin/ClickableRow";
import { CustomerActions } from "@/components/admin/CustomerEditor";
import { loadCustomer } from "@/lib/admin/customers";
import { customerStatusInfo } from "@/lib/admin/customer-status";
import { statusInfo } from "@/lib/admin/data";
import { date, dateTime, num, taka } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "গ্রাহকের বিস্তারিত" };

export default async function AdminCustomerDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const data = await loadCustomer(decodeURIComponent(id));
  if (data.error) {
    return (
      <>
        <PageHeader title="গ্রাহক" />
        <ConnectionError message={data.error} />
      </>
    );
  }
  const { customer, hasProfiles } = data;
  if (!customer) notFound();

  const info = customerStatusInfo(customer.status);
  const waNumber = `88${customer.phone}`;

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> সব গ্রাহক
      </Link>
      <PageHeader
        title={customer.name}
        description={customer.firstOrder ? `প্রথম অর্ডার: ${date(customer.firstOrder)}` : "এখনো কোনো অর্ডার নেই"}
        actions={<CustomerActions customer={customer} disabled={!hasProfiles} />}
      />
      {!hasProfiles ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          এডিট ও ডিলিট চালু করতে Supabase-এ <code className="font-mono">2026-11-17-customers.sql</code> migration চালাতে হবে।
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="মোট অর্ডার" value={`${num(customer.orderCount)}টি`} hint={`সফল/চলমান ${num(customer.salesCount)}টি`} />
        <KpiCard label="মোট কেনাকাটা" value={taka(customer.totalSpent)} hint="বাতিল ও ফেরত বাদে" />
        <KpiCard label="শেষ অর্ডার" value={customer.lastOrder ? date(customer.lastOrder) : "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title="গ্রাহকের তথ্য">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">স্ট্যাটাস</dt>
              <dd className="mt-1"><Badge tone={info.tone}>{info.label}</Badge></dd>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              <div>
                <dt className="text-neutral-500">মোবাইল</dt>
                <dd className="font-semibold">
                  <a href={`tel:${customer.phone}`} className="text-[#b45309] hover:underline">{customer.phone}</a>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              <div>
                <dt className="text-neutral-500">ঠিকানা</dt>
                <dd className="font-medium text-neutral-900">{customer.address || "—"}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              <div>
                <dt className="text-neutral-500">নোট</dt>
                <dd className="whitespace-pre-line text-neutral-900">{customer.note || "কোনো নোট নেই"}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card title={`ক্রয়ের ইতিহাস (${num(customer.orderCount)}টি)`}>
          {customer.orders.length > 0 ? (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>অর্ডার</th>
                  <th className={th}>তারিখ</th>
                  <th className={th}>মোট</th>
                  <th className={th}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => {
                  const s = statusInfo(order.status);
                  return (
                    <ClickableRow key={order.id} href={`/admin/orders/${order.id}`}>
                      <td className={td}>
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[#b45309] hover:underline">
                          #{order.number ?? order.id}
                        </Link>
                      </td>
                      <td className={`${td} text-neutral-600`}>{dateTime(order.created_at)}</td>
                      <td className={`${td} font-semibold`}>{taka(order.total)}</td>
                      <td className={td}><Badge tone={s.tone}>{s.label}</Badge></td>
                    </ClickableRow>
                  );
                })}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState title="এই গ্রাহকের কোনো অর্ডার নেই" />
          )}
        </Card>
      </div>
    </>
  );
}
