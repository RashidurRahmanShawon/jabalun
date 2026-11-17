"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Save, Trash2 } from "lucide-react";
import { Button } from "./ui";
import { ConfirmDialog } from "./Modal";
import { changeOrderStatus, deleteOrdersAction } from "@/app/admin/orders/actions";

// statuses: [{ id, label }]
export default function OrderToolbar({ orderId, orderNumber, status, statuses }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const remove = () => {
    setConfirming(false);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteOrdersAction([orderId]);
      if (result?.error || result?.deleted === 0) {
        setMessage({ tone: "error", text: result?.error || "অর্ডারটি মোছা যায়নি।" });
      } else {
        router.replace("/admin/orders");
      }
    });
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, value);
      if (result?.error) {
        setMessage({ tone: "error", text: result.error });
      } else {
        setMessage({ tone: "ok", text: "স্ট্যাটাস সংরক্ষণ হয়েছে" });
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <label className="sr-only" htmlFor="order-status">স্ট্যাটাস</label>
      <select
        id="order-status"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setMessage(null);
        }}
        disabled={pending}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <Button onClick={save} disabled={pending || value === status}>
        <Save className="h-4 w-4" /> {pending ? "সংরক্ষণ হচ্ছে…" : "স্ট্যাটাস সংরক্ষণ"}
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> ইনভয়েস প্রিন্ট
      </Button>
      <Button variant="secondary" className="text-red-700 hover:bg-red-50" onClick={() => setConfirming(true)} disabled={pending}>
        <Trash2 className="h-4 w-4" /> অর্ডার মুছুন
      </Button>
      {message ? (
        <span className={`text-sm ${message.tone === "error" ? "text-red-600" : "text-green-700"}`} role="status">
          {message.text}
        </span>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title={`অর্ডার #${orderNumber ?? orderId} মুছে ফেলবেন?`}
        message={'অর্ডারটি স্থায়ীভাবে মুছে যাবে, আর ফেরত আনা যাবে না। (শুধু বাতিল করতে চাইলে স্ট্যাটাস "Cancelled" করুন।)'}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={remove}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
