"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Badge, Button } from "./ui";

export default function OrderStatusActions({ initialStatus, statuses }) {
  const [status, setStatus] = useState(initialStatus);
  const [changed, setChanged] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Badge tone={statuses[status].tone}>{statuses[status].label}</Badge>
      <label className="sr-only" htmlFor="order-status">স্ট্যাটাস বদলান</label>
      <select
        id="order-status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setChanged(true);
        }}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        {Object.entries(statuses).map(([id, s]) => (
          <option key={id} value={id}>{s.label}</option>
        ))}
      </select>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> ইনভয়েস প্রিন্ট
      </Button>
      {changed ? <span className="text-xs text-amber-700">নমুনা — স্ট্যাটাস কোথাও সংরক্ষণ হয়নি</span> : null}
    </div>
  );
}
