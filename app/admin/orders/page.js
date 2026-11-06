import Link from "next/link";
import { Badge, Card, ConnectionError, EmptyState, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import Pagination from "@/components/admin/Pagination";
import { requireAdmin } from "@/lib/admin/session";
import { loadOrderList, statusInfo } from "@/lib/admin/data";
import { dateTime, num, taka } from "@/lib/admin/format";

export const metadata = { title: "অর্ডার" };

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const rawStatus = firstValue(params.status) ?? "";
  const status = /^[a-z0-9-]{1,40}$/.test(rawStatus) ? rawStatus : "";
  const page = Math.max(1, Number.parseInt(firstValue(params.page), 10) || 1);

  const data = await loadOrderList({ status: status || undefined, page });

  const hrefFor = (s, p = 1) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (p > 1) q.set("page", String(p));
    const query = q.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader title="অর্ডার" description="WooCommerce-এর আসল অর্ডার, নতুনটি আগে" />

      {data.error ? (
        <ConnectionError message={data.error} />
      ) : (
        <Card>
          <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="navigation" aria-label="স্ট্যাটাস ফিল্টার">
            {[{ slug: "", label: "সব", total: data.statuses.reduce((sum, s) => sum + s.total, 0) },
              ...data.statuses.map((s) => ({ slug: s.slug, label: statusInfo(s.slug, s.name).label, total: s.total }))].map((s) => (
              <Link
                key={s.slug || "all"}
                href={hrefFor(s.slug)}
                aria-current={status === s.slug ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  status === s.slug ? "bg-[#b45309] text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {s.label} <span className="opacity-70">({num(s.total)})</span>
              </Link>
            ))}
          </div>

          {data.orders.length > 0 ? (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>অর্ডার নম্বর</th>
                  <th className={th}>তারিখ</th>
                  <th className={th}>ক্রেতা</th>
                  <th className={th}>পণ্য</th>
                  <th className={th}>মোট</th>
                  <th className={th}>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => {
                  const info = statusInfo(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[#b45309] hover:underline">
                          #{o.number}
                        </Link>
                      </td>
                      <td className={`${td} text-neutral-600`}>{dateTime(o.date)}</td>
                      <td className={td}>{o.customerName}</td>
                      <td className={td}>{num(o.itemCount)}টি</td>
                      <td className={`${td} font-semibold`}>{taka(o.total)}</td>
                      <td className={td}>
                        <Badge tone={info.tone}>{info.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState title={page > 1 ? "এই পেজে কোনো অর্ডার নেই" : "এই স্ট্যাটাসে কোনো অর্ডার নেই"} />
          )}

          <Pagination page={page} totalPages={data.totalPages} makeHref={(p) => hrefFor(status, p)} />
          <p className="mt-3 text-center text-xs text-neutral-500">মোট {num(data.total)}টি অর্ডার</p>
        </Card>
      )}
    </>
  );
}
