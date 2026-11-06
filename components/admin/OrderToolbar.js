"use client";

import { Printer } from "lucide-react";
import { Button } from "./ui";

// Status changes are read-only for now (writing to WooCommerce needs separate approval)
export default function OrderToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> ইনভয়েস প্রিন্ট
      </Button>
      <Button variant="secondary" disabled title="শীঘ্রই">
        স্ট্যাটাস বদলান <span className="text-xs font-normal">(শীঘ্রই)</span>
      </Button>
    </div>
  );
}
