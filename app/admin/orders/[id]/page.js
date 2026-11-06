import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Card, ConnectionError, PageHeader } from "@/components/admin/ui";
import OrderToolbar from "@/components/admin/OrderToolbar";
import { requireAdmin } from "@/lib/admin/session";
import { CONNECTION_ERROR, statusInfo } from "@/lib/admin/data";
import { getOrder } from "@/lib/woo";
import { decodeEntities } from "@/lib/text";
import { dateTime, num, taka } from "@/lib/admin/format";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `অর্ডার #${id}` };
}

async function load(id) {
  try {
    return { order: await getOrder(id) };
  } catch (error) {
    console.error("Admin order detail failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

export default async function AdminOrderDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { order, error } = await load(id);
  const back = (
    <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 print:hidden">
      <ArrowLeft className="h-4 w-4" /> সব অর্ডার
    </Link>
  );

  if (error) {
    return (
      <>
        {back}
        <ConnectionError message={error} />
      </>
    );
  }
  if (!order) notFound();

  const status = statusInfo(order.status);
  const shipping = order.shipping?.address_1 ? order.shipping : order.billing;
  const name = decodeEntities([shipping?.first_name, shipping?.last_name].filter(Boolean).join(" ")) || "—";
  const address = [shipping?.address_1, shipping?.address_2, shipping?.city, shipping?.state].filter(Boolean).join(", ") || "—";
  const phone = shipping?.phone || order.billing?.phone || "—";
  const fees = order.fee_lines ?? [];
  const subtotal = (order.line_items ?? []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return (
    <>
      {back}
      <PageHeader
        title={`অর্ডার #${order.number}`}
        description={dateTime(`${order.date_created_gmt}Z`)}
        actions={<Badge tone={status.tone}>{status.label}</Badge>}
      />
      <div className="mb-6">
        <OrderToolbar />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="পণ্যের তালিকা" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-2 font-medium">পণ্য</th>
                <th className="pb-2 text-right font-medium">পরিমাণ</th>
                <th className="pb-2 text-right font-medium">মূল্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(order.line_items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-3">{decodeEntities(item.name)}</td>
                  <td className="py-2.5 text-right">{num(item.quantity)}</td>
                  <td className="py-2.5 text-right">{taka(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-200">
              <tr>
                <td colSpan={2} className="pt-3 text-neutral-600">সাবটোটাল</td>
                <td className="pt-3 text-right">{taka(subtotal)}</td>
              </tr>
              {fees.map((fee) => (
                <tr key={fee.id} className={Number(fee.total) < 0 ? "text-green-700" : ""}>
                  <td colSpan={2} className="pt-2">{decodeEntities(fee.name)}</td>
                  <td className="pt-2 text-right">
                    {Number(fee.total) < 0 ? `−${taka(Math.abs(Number(fee.total)))}` : taka(fee.total)}
                  </td>
                </tr>
              ))}
              {(order.shipping_lines ?? []).map((line) => (
                <tr key={line.id}>
                  <td colSpan={2} className="pt-2 text-neutral-600">{decodeEntities(line.method_title) || "ডেলিভারি"}</td>
                  <td className="pt-2 text-right">{Number(line.total) > 0 ? taka(line.total) : "ফ্রি"}</td>
                </tr>
              ))}
              <tr className="text-base font-bold">
                <td colSpan={2} className="pt-3">মোট</td>
                <td className="pt-3 text-right">{taka(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <div className="space-y-6">
          <Card title="ক্রেতা ও ডেলিভারি">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">নাম</dt>
                <dd className="font-medium">{name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">ফোন</dt>
                <dd className="font-medium">{phone}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">ডেলিভারি ঠিকানা</dt>
                <dd className="font-medium">{address}</dd>
              </div>
            </dl>
          </Card>
          <Card title="পেমেন্ট">
            <p className="text-sm font-medium">{decodeEntities(order.payment_method_title) || order.payment_method || "—"}</p>
            {order.payment_method === "cod" ? <p className="mt-1 text-xs text-neutral-500">ক্যাশ অন ডেলিভারি (COD)</p> : null}
          </Card>
          <Card title="ক্রেতার নোট">
            <p className="whitespace-pre-line text-sm text-neutral-700">{order.customer_note || "কোনো নোট নেই"}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
