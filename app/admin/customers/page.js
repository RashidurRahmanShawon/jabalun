import Link from "next/link";
import { CalendarDays, CalendarRange, Sun } from "lucide-react";
import { Badge, Card, ConnectionError, EmptyState, PageHeader, TableWrap, td, th } from "@/components/admin/ui";
import ClickableRow from "@/components/admin/ClickableRow";
import { AddCustomerButton } from "@/components/admin/CustomerEditor";
import { DATE_FILTERS, dateFilterLabel, monthLabel } from "@/lib/admin/data";
import { loadCustomers } from "@/lib/admin/customers";
import { CUSTOMER_STATUSES, customerStatusInfo } from "@/lib/admin/customer-status";
import { date, num, taka } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "গ্রাহক" };

const first = (value) => (Array.isArray(value) ? value[0] : value);

const CARDS = [
  { id: "today", label: "আজ অর্ডার করেছেন", icon: Sun },
  { id: "week", label: "এই সপ্তাহে", hint: "শনিবার থেকে", icon: CalendarRange },
  { id: "month", label: "এই মাসে", icon: CalendarDays },
];

// Last 6 months (Dhaka time) for the date filter
function recentMonths() {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: monthLabel(key) };
  });
}

export default async function AdminCustomersPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const rawDate = first(params.date) ?? "";
  const dateFilter = DATE_FILTERS[rawDate] || /^\d{4}-(0[1-9]|1[0-2])$/.test(rawDate) ? rawDate : "";
  const rawStatus = first(params.status) ?? "";
  const status = CUSTOMER_STATUSES[rawStatus] ? rawStatus : "";
  const q = String(first(params.q) ?? "").slice(0, 60);

  const data = await loadCustomers({ date: dateFilter, q, status });

  const hrefFor = ({ d = dateFilter, s = status } = {}) => {
    const query = new URLSearchParams();
    if (d) query.set("date", d);
    if (s) query.set("status", s);
    if (q) query.set("q", q);
    const str = query.toString();
    return str ? `/admin/customers?${str}` : "/admin/customers";
  };

  if (data.error) {
    return (
      <>
        <PageHeader title="গ্রাহক" description="অর্ডার থেকে স্বয়ংক্রিয়ভাবে তৈরি গ্রাহক তালিকা" />
        <ConnectionError message={data.error} />
      </>
    );
  }

  const { customers, stats, hasProfiles } = data;
  const filtered = Boolean(dateFilter || status || q);

  return (
    <>
      <PageHeader
        title="গ্রাহক"
        description="প্রতিটি নতুন অর্ডারের গ্রাহক নিজে থেকেই এখানে যোগ হয় (মোবাইল নম্বর অনুযায়ী)"
        actions={<AddCustomerButton disabled={!hasProfiles} />}
      />

      {!hasProfiles ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          গ্রাহক এডিট, ডিলিট বা নতুন যোগ করতে Supabase-এ একবার migration চালাতে হবে:{" "}
          <code className="font-mono">supabase/migrations/2026-11-17-customers.sql</code>। ততক্ষণ তালিকা শুধু দেখা যাবে।
        </p>
      ) : null}

      {/* Today / this week / this month (click to filter) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ id, label, hint, icon: Icon }) => {
          const card = stats.cards[id];
          const active = dateFilter === id;
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
              <p className="mt-3 text-3xl font-bold text-neutral-900">
                {num(card.customers)}
                <span className="ml-1 text-base font-semibold text-neutral-500">জন</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">এর মধ্যে নতুন গ্রাহক {num(card.newCustomers)} জন</p>
            </Link>
          );
        })}
      </div>

      <Card>
        {/* Filters: plain GET form, works without JavaScript */}
        <form action="/admin/customers" className="mb-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="cust-q">খুঁজুন</label>
          <input
            id="cust-q"
            name="q"
            defaultValue={q}
            placeholder="নাম বা মোবাইল নম্বর"
            className="min-w-[180px] flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm sm:max-w-xs"
          />
          <label className="sr-only" htmlFor="cust-date">তারিখ</label>
          <select id="cust-date" name="date" defaultValue={dateFilter} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">সব তারিখ</option>
            {Object.entries(DATE_FILTERS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
            {recentMonths().map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="cust-status">স্ট্যাটাস</label>
          <select id="cust-status" name="status" defaultValue={status} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">সব স্ট্যাটাস</option>
            {Object.entries(CUSTOMER_STATUSES).map(([id, s]) => (
              <option key={id} value={id}>{s.label}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-[#b45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#92400e]">
            ফিল্টার
          </button>
          {filtered ? (
            <Link href="/admin/customers" className="px-2 text-sm text-neutral-500 underline hover:text-neutral-900">
              ফিল্টার মুছুন
            </Link>
          ) : null}
        </form>

        {customers.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>নাম</th>
                <th className={th}>মোবাইল</th>
                <th className={th}>স্ট্যাটাস</th>
                <th className={th}>{dateFilter ? `অর্ডার (${dateFilterLabel(dateFilter)})` : "অর্ডার"}</th>
                <th className={th}>{dateFilter ? "কেনাকাটা (এই সময়ে)" : "মোট কেনাকাটা"}</th>
                <th className={th}>শেষ অর্ডার</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const info = customerStatusInfo(c.status);
                return (
                  <ClickableRow key={c.id} href={`/admin/customers/${c.phone}`}>
                    <td className={td}>
                      <Link href={`/admin/customers/${c.phone}`} className="font-semibold text-[#b45309] hover:underline">
                        {c.name}
                      </Link>
                      {c.orderCount >= 2 ? <span className="ml-2 text-xs text-neutral-500">· পুরনো ক্রেতা</span> : null}
                    </td>
                    <td className={td}>{c.phone}</td>
                    <td className={td}>
                      <Badge tone={info.tone}>{info.label}</Badge>
                    </td>
                    <td className={td}>{num(c.periodOrders)}টি</td>
                    <td className={`${td} font-semibold`}>{taka(c.periodSpent)}</td>
                    <td className={`${td} text-neutral-600`}>{c.lastOrder ? date(c.lastOrder) : "—"}</td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState title={filtered ? "এই ফিল্টারে কোনো গ্রাহক নেই" : "এখনো কোনো গ্রাহক নেই"} />
        )}

        <p className="mt-3 text-center text-xs text-neutral-500">
          {filtered ? `${dateFilterLabel(dateFilter)} — ` : ""}মোট {num(stats.customers)} জন গ্রাহক · একাধিকবার কিনেছেন {num(stats.repeat)} জন
          {" · "}মোট কেনাকাটায় বাতিল, ব্যর্থ ও ফেরত অর্ডার ধরা হয়নি
        </p>
      </Card>
    </>
  );
}
