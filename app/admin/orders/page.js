import Link from "next/link";
import { CalendarDays, CalendarRange, Sun } from "lucide-react";
import { Badge, Card, ConnectionError, EmptyState, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import Pagination from "@/components/admin/Pagination";
import { requireAdmin } from "@/lib/admin/session";
import { DATE_FILTERS, dateFilterLabel, loadOrderList, statusInfo } from "@/lib/admin/data";
import { dateTime, num, taka } from "@/lib/admin/format";
import { SOURCES, sourceInfo } from "@/lib/order-source";

export const metadata = { title: "অর্ডার" };

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

const CARDS = [
  { id: "today", label: "আজকের অর্ডার", icon: Sun },
  { id: "week", label: "এই সপ্তাহের অর্ডার", hint: "শনিবার থেকে", icon: CalendarRange },
  { id: "month", label: "এই মাসের অর্ডার", icon: CalendarDays },
];

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const rawStatus = firstValue(params.status) ?? "";
  const status = /^[a-z0-9-]{1,40}$/.test(rawStatus) ? rawStatus : "";
  const rawDate = firstValue(params.date) ?? "";
  const date = DATE_FILTERS[rawDate] || /^\d{4}-(0[1-9]|1[0-2])$/.test(rawDate) ? rawDate : "";
  const rawSource = firstValue(params.source) ?? "";
  const source = SOURCES[rawSource] ? rawSource : "";
  const page = Math.max(1, Number.parseInt(firstValue(params.page), 10) || 1);

  const data = await loadOrderList({ status: status || undefined, page, date: date || undefined, source: source || undefined });

  const hrefFor = ({ s = status, d = date, src = source, p = 1 } = {}) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (d) q.set("date", d);
    if (src) q.set("source", src);
    if (p > 1) q.set("page", String(p));
    const query = q.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };

  if (data.error) {
    return (
      <>
        <PageHeader title="অর্ডার" description="সব আসল অর্ডার, নতুনটি আগে" />
        <ConnectionError message={data.error} />
      </>
    );
  }

  const { stats } = data;
  const filtered = Boolean(date || source);
  const sourceTotal = stats.sources.reduce((sum, s) => sum + s.orders, 0);

  return (
    <>
      <PageHeader title="অর্ডার" description="সব আসল অর্ডার, নতুনটি আগে" />

      {/* Today / this week / this month */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ id, label, hint, icon: Icon }) => {
          const card = stats.cards[id];
          const active = date === id;
          return (
            <Link
              key={id}
              href={hrefFor({ d: active ? "" : id })}
              aria-current={active ? "true" : undefined}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:border-[#b45309] ${
                active ? "border-[#b45309] ring-2 ring-[#b45309]/20" : "border-neutral-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-500">
                  {label} {hint ? <span className="text-xs text-neutral-400">({hint})</span> : null}
                </p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-[#b45309]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-neutral-900">{num(card.orders)}<span className="ml-1 text-base font-semibold text-neutral-500">টি</span></p>
              <p className="mt-1 text-xs text-neutral-500">বিক্রি {taka(card.revenue)} (বাতিল বাদে)</p>
            </Link>
          );
        })}
      </div>

      <Card>
        {/* Filters (plain GET form: works without JavaScript) */}
        <form action="/admin/orders" className="mb-4 flex flex-wrap items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="sr-only" htmlFor="filter-date">তারিখ</label>
          <select id="filter-date" name="date" defaultValue={date} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">সব তারিখ</option>
            {Object.entries(DATE_FILTERS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
            {stats.months.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          {stats.hasSource ? (
            <>
              <label className="sr-only" htmlFor="filter-source">সোর্স</label>
              <select id="filter-source" name="source" defaultValue={source} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option value="">সব সোর্স</option>
                {Object.entries(SOURCES).map(([id, s]) => (
                  <option key={id} value={id}>{s.label}</option>
                ))}
              </select>
            </>
          ) : null}
          <button type="submit" className="rounded-lg bg-[#b45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#92400e]">
            ফিল্টার
          </button>
          {filtered ? (
            <Link href={hrefFor({ d: "", src: "" })} className="px-2 text-sm text-neutral-500 underline hover:text-neutral-900">
              ফিল্টার মুছুন
            </Link>
          ) : null}
        </form>

        {/* Status tabs (keep the date/source filter) */}
        <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="navigation" aria-label="স্ট্যাটাস ফিল্টার">
          {[{ slug: "", label: "All", total: data.statuses.reduce((sum, s) => sum + s.total, 0) },
            ...data.statuses.map((s) => ({ slug: s.slug, label: statusInfo(s.slug, s.name).label, total: s.total }))].map((s) => (
            <Link
              key={s.slug || "all"}
              href={hrefFor({ s: s.slug })}
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
                <th className={th}>সোর্স</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
                const info = statusInfo(o.status);
                const src = sourceInfo(o.source);
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
                    <td className={td}>
                      <Badge tone={src.tone}>{src.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState title={page > 1 ? "এই পেজে কোনো অর্ডার নেই" : "এই ফিল্টারে কোনো অর্ডার নেই"} />
        )}

        <Pagination page={page} totalPages={data.totalPages} makeHref={(p) => hrefFor({ p })} />
        <p className="mt-3 text-center text-xs text-neutral-500">
          {filtered ? `${dateFilterLabel(date)}${source ? ` · ${sourceInfo(source).label}` : ""} — ` : ""}মোট {num(data.total)}টি অর্ডার
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={`সোর্স অনুযায়ী অর্ডার — ${dateFilterLabel(date)}`}>
          {!stats.hasSource ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              সোর্স ট্র্যাকিং চালু করতে Supabase-এ একবার ডাটাবেস আপডেট (migration) চালাতে হবে।
            </p>
          ) : sourceTotal === 0 ? (
            <EmptyState title="এই সময়ে কোনো অর্ডার নেই" />
          ) : (
            <ul className="space-y-3">
              {stats.sources.map((s) => {
                const info = sourceInfo(s.id);
                const share = (s.orders / sourceTotal) * 100;
                return (
                  <li key={s.id}>
                    <Link href={hrefFor({ src: s.id })} className="block rounded-lg p-1 hover:bg-neutral-50">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-neutral-800">{info.label}</span>
                        <span className="text-neutral-600">
                          <b className="text-neutral-900">{num(s.orders)}টি</b> · {Math.round(share)}% · {taka(s.revenue)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-[#b45309]" style={{ width: `${Math.max(2, share)}%` }} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="মাস অনুযায়ী অর্ডার">
          {stats.months.length === 0 ? (
            <EmptyState title="এখনো কোনো অর্ডার নেই" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="pb-2 font-medium">মাস</th>
                  <th className="pb-2 text-right font-medium">মোট অর্ডার</th>
                  <th className="pb-2 text-right font-medium">বিক্রি (বাতিল বাদে)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats.months.map((m) => (
                  <tr key={m.key} className={date === m.key ? "bg-amber-50" : ""}>
                    <td className="py-2.5">
                      <Link href={hrefFor({ d: m.key })} className="font-semibold text-[#b45309] hover:underline">{m.label}</Link>
                    </td>
                    <td className="py-2.5 text-right">{num(m.orders)}টি</td>
                    <td className="py-2.5 text-right">{taka(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
