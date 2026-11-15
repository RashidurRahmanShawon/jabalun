import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Phone, User } from "lucide-react";
import { Badge, Card, ConnectionError, PageHeader } from "@/components/admin/ui";
import OrderToolbar from "@/components/admin/OrderToolbar";
import OrderInvoice from "@/components/admin/OrderInvoice";
import { requireAdmin } from "@/lib/admin/session";
import { CONNECTION_ERROR, statusInfo } from "@/lib/admin/data";
import { getOrder } from "@/lib/woo";
import { decodeEntities } from "@/lib/text";
import { normalizePhone } from "@/lib/phone";
import { num, taka } from "@/lib/admin/format";
import { sourceInfo } from "@/lib/order-source";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `অর্ডার #${id}` };
}

const STATUS_OPTIONS = ["processing", "pending", "on-hold", "completed", "cancelled", "refunded", "failed"];

const FULL_DATE = new Intl.DateTimeFormat("bn-BD-u-nu-latn", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

// Supabase returns "...+00:00"; never append "Z" to that (it made the date invalid and crashed the page)
function formatDate(raw) {
  if (!raw) return "—";
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? "—" : FULL_DATE.format(new Date(ms));
}

async function load(id) {
  try {
    return { order: await getOrder(id) };
  } catch (error) {
    console.error("Admin order detail failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="break-words font-medium text-neutral-900">{children}</dd>
      </div>
    </div>
  );
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
  const contact = order.shipping?.address_1 ? order.shipping : order.billing;
  const name = decodeEntities([contact?.first_name, contact?.last_name].filter(Boolean).join(" ")) || "—";
  const address = decodeEntities(contact?.address_1 || "") || "—";
  const rawPhone = contact?.phone && contact.phone !== "—" ? contact.phone : "";
  const phone = rawPhone ? normalizePhone(rawPhone) : "";
  const items = order.line_items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = Number(order.discount) || 0;
  const deliveryFee = Number(order.delivery_fee) || 0;

  return (
    <>
      <OrderInvoice order={order} name={name} phone={phone} address={address} statusLabel={status.label} />
      <div className="print:hidden">
      {back}
      <PageHeader
        title={`অর্ডার #${order.number}`}
        description={`${formatDate(order.created_at)} · ${decodeEntities(order.payment_method_title)}`}
        actions={<Badge tone={status.tone}>{status.label}</Badge>}
      />
      <div className="mb-6">
        <OrderToolbar
          key={order.status}
          orderId={order.id}
          status={order.status}
          statuses={STATUS_OPTIONS.map((s) => ({ id: s, label: statusInfo(s).label }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`অর্ডার করা পণ্য (${num(itemCount)}টি)`}>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="pb-2 font-medium">পণ্য</th>
                    <th className="pb-2 text-right font-medium">দাম</th>
                    <th className="pb-2 text-right font-medium">পরিমাণ</th>
                    <th className="pb-2 text-right font-medium">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200 object-cover" />
                          ) : (
                            <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-100" />
                          )}
                          <div>
                            <p className="font-semibold text-neutral-900">{item.name}</p>
                            <p className="text-xs text-neutral-500">
                              {item.design_number ? `ডিজাইন নং: ${item.design_number}` : null}
                              {item.design_number && item.product_id ? " · " : null}
                              {item.product_id ? `প্রোডাক্ট আইডি: ${item.product_id}` : null}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">{taka(item.price)}</td>
                      <td className="py-3 text-right">× {num(item.quantity)}</td>
                      <td className="py-3 text-right font-semibold">{taka(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 ml-auto max-w-xs space-y-2 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">পণ্যের মোট</dt>
                <dd>{taka(order.subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-green-700">
                  <dt>ছাড়</dt>
                  <dd>−{taka(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-neutral-600">ডেলিভারি</dt>
                <dd>{deliveryFee > 0 ? taka(deliveryFee) : "ফ্রি"}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
                <dt>সর্বমোট</dt>
                <dd>{taka(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="ক্রেতার নোট">
            <p className="whitespace-pre-line text-sm text-neutral-700">{order.customer_note || "কোনো নোট নেই"}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="ক্রেতা ও ডেলিভারি তথ্য">
            <dl className="space-y-4 text-sm">
              <Row icon={User} label="নাম">{name}</Row>
              <Row icon={Phone} label="মোবাইল নম্বর">
                {phone ? (
                  <a href={`tel:${phone}`} className="text-[#b45309] hover:underline">{phone}</a>
                ) : "—"}
              </Row>
              <Row icon={MapPin} label="ডেলিভারি ঠিকানা">
                <span className="whitespace-pre-line">{address}</span>
              </Row>
            </dl>
            {phone ? (
              <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  <Phone className="h-4 w-4" /> কল করুন
                </a>
                <a
                  href={`https://wa.me/88${phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            ) : null}
          </Card>

          <Card title="অর্ডারের তথ্য">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">অর্ডার নম্বর</dt>
                <dd className="font-medium">#{order.number}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">তারিখ</dt>
                <dd className="text-right font-medium">{formatDate(order.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">পেমেন্ট</dt>
                <dd className="text-right font-medium">{decodeEntities(order.payment_method_title)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">সোর্স</dt>
                <dd className="text-right">
                  <Badge tone={sourceInfo(order.source).tone}>
                    {sourceInfo(order.source).label}
                    {order.source_detail?.paid ? " (Ads)" : ""}
                  </Badge>
                </dd>
              </div>
              {order.source_detail?.utm_campaign ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">ক্যাম্পেইন</dt>
                  <dd className="break-all text-right font-medium">{order.source_detail.utm_campaign}</dd>
                </div>
              ) : null}
              {order.source_detail?.referrer ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">যে সাইট থেকে এসেছে</dt>
                  <dd className="break-all text-right font-medium">{order.source_detail.referrer}</dd>
                </div>
              ) : null}
              {order.source_detail?.landing ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">প্রথম যে পেজে এসেছে</dt>
                  <dd className="break-all text-right font-medium">{order.source_detail.landing}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">স্ট্যাটাস</dt>
                <dd><Badge tone={status.tone}>{status.label}</Badge></dd>
              </div>
              {order.updated_at && order.updated_at !== order.created_at ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500">শেষ আপডেট</dt>
                  <dd className="text-right font-medium">{formatDate(order.updated_at)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
