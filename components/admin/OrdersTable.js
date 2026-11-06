"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, TableWrap, td, th } from "./ui";
import { dateTime, num, taka } from "@/lib/admin/format";

export default function OrdersTable({ orders, statuses }) {
  const [filter, setFilter] = useState("");
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;
  const counts = Object.fromEntries(Object.keys(statuses).map((s) => [s, orders.filter((o) => o.status === s).length]));

  const tab = (id, label, count) => (
    <button
      key={id || "all"}
      type="button"
      aria-pressed={filter === id}
      onClick={() => setFilter(id)}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        filter === id ? "bg-[#b45309] text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      {label} <span className="opacity-70">({num(count)})</span>
    </button>
  );

  return (
    <Card>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="স্ট্যাটাস ফিল্টার">
        {tab("", "সব", orders.length)}
        {Object.entries(statuses).map(([id, s]) => tab(id, s.label, counts[id]))}
      </div>

      {visible.length > 0 ? (
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
            {visible.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[#b45309] hover:underline">
                    #{o.id}
                  </Link>
                </td>
                <td className={`${td} text-neutral-600`}>{dateTime(o.date)}</td>
                <td className={td}>{o.customerName}</td>
                <td className={td}>{num(o.items.reduce((s, i) => s + i.quantity, 0))}টি</td>
                <td className={`${td} font-semibold`}>{taka(o.total)}</td>
                <td className={td}>
                  <Badge tone={statuses[o.status].tone}>{statuses[o.status].label}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="এই স্ট্যাটাসে কোনো অর্ডার নেই" />
      )}
    </Card>
  );
}
