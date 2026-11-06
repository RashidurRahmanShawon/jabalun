"use client";

import { useState } from "react";
import { Banknote, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Toggle, inputClass } from "./ui";
import { taka } from "@/lib/admin/format";

export default function DeliverySettings({ initialZones }) {
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [zones, setZones] = useState(initialZones);

  const update = (id, field, value) => setZones((list) => list.map((z) => (z.id === id ? { ...z, [field]: value } : z)));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="পেমেন্ট পদ্ধতি">
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <Banknote className="h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-neutral-900">ক্যাশ অন ডেলিভারি</p>
            <p className="text-xs text-neutral-600">পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
          </div>
          <Badge tone="green">সক্রিয়</Badge>
        </div>
        <p className="mt-3 text-xs text-neutral-500">এই মুহূর্তে শুধু ক্যাশ অন ডেলিভারি চালু আছে।</p>
      </Card>

      <Card title="ডেলিভারি চার্জ ও এলাকা" className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-4">
          <div>
            <p className="font-semibold">সারা বাংলাদেশে ফ্রি ডেলিভারি</p>
            <p className="text-xs text-neutral-500">চালু থাকলে নিচের চার্জ উপেক্ষা করা হয়</p>
          </div>
          <Toggle checked={freeDelivery} onChange={setFreeDelivery} label="ফ্রি ডেলিভারি" />
        </div>

        {zones.length > 0 ? (
          <ul className="space-y-3">
            {zones.map((z) => (
              <li key={z.id} className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_8rem_7rem_auto] sm:items-center">
                <input aria-label="এলাকা" className={inputClass} value={z.area} onChange={(e) => update(z.id, "area", e.target.value)} />
                <input
                  aria-label="চার্জ (৳)"
                  type="number"
                  min="0"
                  className={inputClass}
                  value={z.charge}
                  disabled={freeDelivery}
                  onChange={(e) => update(z.id, "charge", Number(e.target.value))}
                />
                <input aria-label="সময়" className={inputClass} value={z.days} onChange={(e) => update(z.id, "days", e.target.value)} />
                <button type="button" onClick={() => setZones((list) => list.filter((x) => x.id !== z.id))} aria-label="এলাকা সরান" className="justify-self-end rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="কোনো এলাকা যোগ করা হয়নি" />
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => setZones((list) => [...list, { id: `z${Date.now()}`, area: "নতুন এলাকা", charge: 0, days: "৩–৫ দিন" }])}>
            <Plus className="h-4 w-4" /> এলাকা যোগ করুন
          </Button>
          <p className="text-xs text-neutral-500">
            {freeDelivery ? "ফ্রি ডেলিভারি চালু — ক্রেতা কোনো চার্জ দেবেন না" : `সর্বোচ্চ চার্জ: ${taka(Math.max(0, ...zones.map((z) => z.charge)))}`} · নমুনা, কোথাও সংরক্ষণ হয় না
          </p>
        </div>
      </Card>
    </div>
  );
}
