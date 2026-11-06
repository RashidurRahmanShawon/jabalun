import Link from "next/link";
import { Banknote, Percent, ShoppingCart, TrendingUp, TriangleAlert } from "lucide-react";
import { Badge, Card, ConnectionError, EmptyState, KpiCard, PageHeader } from "@/components/admin/ui";
import SalesChart from "@/components/admin/SalesChart";
import { requireAdmin } from "@/lib/admin/session";
import { loadAdminProducts, loadOverview, statusInfo } from "@/lib/admin/data";
import { dateTime, num, taka } from "@/lib/admin/format";

export const metadata = { title: "ওভারভিউ" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [overview, stock] = await Promise.all([loadOverview(), loadAdminProducts()]);

  return (
    <>
      <PageHeader title="ওভারভিউ" description="WooCommerce-এর আসল অর্ডার থেকে — গত ৩০ দিন (ঢাকার সময়)" />

      {overview.error ? (
        <ConnectionError message={overview.error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="আজকের বিক্রি" value={taka(overview.todayRevenue)} hint="ছাড়ের পরে, বাতিল ছাড়া" icon={Banknote} />
            <KpiCard label="আজকের অর্ডার" value={num(overview.todayOrders)} hint={`গত ৩০ দিনে ${num(overview.orders30)}টি`} icon={ShoppingCart} />
            <KpiCard label="গড় অর্ডার মূল্য" value={taka(overview.averageOrder)} hint="গত ৩০ দিনের গড়" icon={TrendingUp} />
            <KpiCard label="রূপান্তর হার" value="—" hint="ট্র্যাকিং ডেটাবেস যুক্ত হলে দেখা যাবে" icon={Percent} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card title="দৈনিক বিক্রি (গত ৩০ দিন)" className="xl:col-span-2">
              <SalesChart days={overview.days} />
            </Card>

            <Card title="জনপ্রিয় পণ্য (শীর্ষ ৫)">
              {overview.topProducts.length > 0 ? (
                <ol className="space-y-3">
                  {overview.topProducts.map((product, i) => (
                    <li key={product.name} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-[#b45309]">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">{product.name}</span>
                      <span className="shrink-0 text-sm font-semibold">{num(product.sold)}টি</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState title="গত ৩০ দিনে কোনো বিক্রি নেই" />
              )}
            </Card>
          </div>

          <Card
            title="সাম্প্রতিক অর্ডার"
            className="mt-6"
            action={<Link href="/admin/orders" className="text-sm font-semibold text-[#b45309] hover:underline">সব দেখুন</Link>}
          >
            {overview.recent.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {overview.recent.map((order) => {
                  const status = statusInfo(order.status);
                  return (
                    <li key={order.id}>
                      <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-neutral-50">
                        <span className="font-semibold">#{order.number}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-600">{order.customerName}</span>
                        <span className="text-xs text-neutral-500">{dateTime(order.date)}</span>
                        <span className="font-semibold">{taka(order.total)}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="গত ৩০ দিনে কোনো অর্ডার নেই" />
            )}
          </Card>
        </>
      )}

      <Card title="স্টক সতর্কতা" className="mt-6">
        {stock.error ? (
          <ConnectionError message={stock.error} />
        ) : stock.lowStock.length + stock.outOfStock.length > 0 ? (
          <ul className="space-y-3">
            {[...stock.outOfStock, ...stock.lowStock.filter((p) => p.stockStatus !== "outofstock")].map((product) => (
              <li key={product.id} className="flex items-center gap-3">
                <TriangleAlert className={`h-5 w-5 shrink-0 ${product.stockStatus === "outofstock" ? "text-red-600" : "text-amber-600"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
                <Badge tone={product.stockStatus === "outofstock" ? "red" : "amber"}>
                  {product.stockStatus === "outofstock" ? "স্টক শেষ" : `${num(product.stock)}টি বাকি`}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={stock.stockTracked ? "সব পণ্যের স্টক যথেষ্ট" : "স্টকের হিসাব চালু নেই"}
            description={
              stock.stockTracked
                ? "৫টির কম স্টকের কোনো পণ্য নেই।"
                : "WooCommerce-এ পণ্যের \"Manage stock\" চালু করলে কম স্টকের সতর্কতা এখানে দেখাবে।"
            }
          />
        )}
      </Card>
    </>
  );
}
