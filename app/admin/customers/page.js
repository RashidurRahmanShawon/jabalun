import Link from "next/link";
import { Card, EmptyState, MockBadge, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import { CUSTOMERS, customerSummary } from "@/lib/admin/mock-data";
import { date, num, taka } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "গ্রাহক" };

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = CUSTOMERS.map(customerSummary).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <>
      <PageHeader title="গ্রাহক" description="সবচেয়ে বেশি কেনাকাটা করা গ্রাহক আগে" actions={<MockBadge />} />
      <Card>
        {customers.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>নাম</th>
                <th className={th}>ফোন</th>
                <th className={th}>অর্ডার</th>
                <th className={th}>মোট ব্যয়</th>
                <th className={th}>শেষ অর্ডার</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className={td}>
                    <Link href={`/admin/customers/${c.id}`} className="font-semibold text-[#b45309] hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className={td}>{c.phone}</td>
                  <td className={td}>{num(c.orderCount)}টি</td>
                  <td className={`${td} font-semibold`}>{taka(c.totalSpent)}</td>
                  <td className={`${td} text-neutral-600`}>{c.lastOrder ? date(c.lastOrder) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState title="এখনো কোনো গ্রাহক নেই" />
        )}
      </Card>
    </>
  );
}
