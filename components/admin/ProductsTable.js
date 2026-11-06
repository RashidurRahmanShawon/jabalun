"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, TableWrap, inputClass, td, th } from "./ui";
import { num, taka } from "@/lib/admin/format";

const STATUS = {
  publish: { label: "প্রকাশিত", tone: "green" },
  draft: { label: "ড্রাফট", tone: "neutral" },
  pending: { label: "অনুমোদনের অপেক্ষায়", tone: "amber" },
  private: { label: "প্রাইভেট", tone: "violet" },
};

// Read-only list of WooCommerce products; editing comes in a later step
export default function ProductsTable({ products }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const categories = [...new Map(products.flatMap((p) => p.categories).map((c) => [c.id, c])).values()];
  const statuses = [...new Set(products.map((p) => p.status))];
  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.designNumber.includes(q)) &&
      (!category || p.categories.some((c) => c.id === category)) &&
      (!status || p.status === status)
  );

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="নাম বা ডিজাইন নম্বর দিয়ে খুঁজুন"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
            aria-label="পণ্য খুঁজুন"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} w-auto`} aria-label="ক্যাটাগরি ফিল্টার">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-auto`} aria-label="স্ট্যাটাস ফিল্টার">
          <option value="">সব স্ট্যাটাস</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{STATUS[s]?.label ?? s}</option>
          ))}
        </select>
        <Button disabled title="শীঘ্রই">
          <Plus className="h-4 w-4" /> নতুন পণ্য <span className="text-xs font-normal">(শীঘ্রই)</span>
        </Button>
      </div>

      <p className="mb-3 text-xs text-neutral-500">
        মোট {num(products.length)}টি পণ্যের মধ্যে {num(visible.length)}টি দেখানো হচ্ছে · শুধু দেখা যাবে, সম্পাদনা শীঘ্রই
      </p>

      {visible.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>ছবি</th>
              <th className={th}>নাম</th>
              <th className={th}>ডিজাইন</th>
              <th className={th}>দাম</th>
              <th className={th}>স্টক</th>
              <th className={th}>ক্যাটাগরি</th>
              <th className={th}>স্ট্যাটাস</th>
              <th className={`${th} text-right`}>কাজ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <span className="relative flex h-12 w-9 items-center justify-center overflow-hidden rounded bg-amber-50 text-[10px] font-bold text-[#b45309]">
                    {p.designNumber || "—"}
                    {p.image ? (
                      <Image src={p.image} alt="" width={36} height={48} sizes="36px" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                  </span>
                </td>
                <td className={`${td} font-medium`}>{p.name}</td>
                <td className={td}>{p.designNumber || "—"}</td>
                <td className={td}>{p.price ? taka(p.price) : "—"}</td>
                <td className={td}>
                  {p.stockStatus === "outofstock" ? (
                    <Badge tone="red">স্টক শেষ</Badge>
                  ) : p.manageStock && p.stock !== null ? (
                    <span className={p.stock <= 5 ? "font-semibold text-red-600" : ""}>{num(p.stock)}</span>
                  ) : (
                    <span className="text-neutral-500">স্টকে আছে</span>
                  )}
                </td>
                <td className={td}>{p.categories.map((c) => c.name).join(", ") || "—"}</td>
                <td className={td}>
                  <Badge tone={STATUS[p.status]?.tone ?? "neutral"}>{STATUS[p.status]?.label ?? p.status}</Badge>
                </td>
                <td className={`${td} text-right`}>
                  <div className="inline-flex gap-1">
                    <button type="button" disabled title="সম্পাদনা — শীঘ্রই" aria-label="সম্পাদনা (শীঘ্রই)" className="rounded-lg p-2 text-neutral-400 disabled:cursor-not-allowed">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" disabled title="মুছে ফেলা — শীঘ্রই" aria-label="মুছুন (শীঘ্রই)" className="rounded-lg p-2 text-neutral-400 disabled:cursor-not-allowed">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="কোনো পণ্য পাওয়া যায়নি" description="খোঁজ বা ফিল্টার বদলে আবার চেষ্টা করুন।" />
      )}
    </Card>
  );
}
