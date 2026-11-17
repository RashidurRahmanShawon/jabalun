"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOrdersAction } from "@/app/admin/orders/actions";
import { Button } from "./ui";
import { ConfirmDialog } from "./Modal";

// Checkbox selection + bulk delete for the admin orders table.
// The table itself stays a server component; only the checkboxes and the bar are client-side.

const SelectionContext = createContext(null);

// orders: [{ id, number }] on the current page
export function OrderSelectionProvider({ orders, children }) {
  const [picked, setSelected] = useState(() => new Set());
  const ids = useMemo(() => orders.map((o) => o.id), [orders]);
  // Only count selections still on the page (after delete, filter or page change)
  const selected = useMemo(() => new Set([...picked].filter((id) => ids.includes(id))), [picked, ids]);

  const value = useMemo(
    () => ({
      orders,
      ids,
      selected,
      toggle: (id) =>
        setSelected((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        }),
      setAll: (on) => setSelected(on ? new Set(ids) : new Set()),
      clear: () => setSelected(new Set()),
    }),
    [orders, ids, selected],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

function useSelection() {
  return useContext(SelectionContext);
}

const boxClass = "h-4 w-4 cursor-pointer accent-[#b45309]";

export function SelectAllCheckbox() {
  const { ids, selected, setAll } = useSelection();
  const ref = useRef(null);
  const all = ids.length > 0 && selected.size === ids.length;
  const some = selected.size > 0 && !all;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some;
  }, [some]);

  return (
    <label className="-m-2 inline-flex cursor-pointer p-2">
      <input
        ref={ref}
        type="checkbox"
        className={boxClass}
        checked={all}
        onChange={(event) => setAll(event.target.checked)}
        aria-label="এই পেজের সব অর্ডার নির্বাচন করুন"
      />
    </label>
  );
}

export function OrderCheckbox({ id, number }) {
  const { selected, toggle } = useSelection();
  return (
    // Large hit area; ClickableRow ignores clicks on labels/inputs, so the row won't open
    <label className="-m-2 inline-flex cursor-pointer p-2">
      <input
        type="checkbox"
        className={boxClass}
        checked={selected.has(id)}
        onChange={() => toggle(id)}
        aria-label={`অর্ডার #${number} নির্বাচন করুন`}
      />
    </label>
  );
}

export function BulkDeleteBar() {
  const router = useRouter();
  const { orders, selected, clear } = useSelection();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  const chosen = orders.filter((o) => selected.has(o.id));
  const count = chosen.length;

  function onDelete() {
    setConfirming(false);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteOrdersAction(chosen.map((o) => o.id));
      if (result?.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      clear();
      setMessage({ tone: "success", text: `${result.deleted}টি অর্ডার মুছে ফেলা হয়েছে।` });
      router.refresh();
    });
  }

  if (count === 0 && !message) return null;

  const numbers = chosen.map((o) => `#${o.number}`);
  const preview = numbers.length > 8 ? `${numbers.slice(0, 8).join(", ")} এবং আরও ${numbers.length - 8}টি` : numbers.join(", ");

  return (
    <>
      <div className="sticky top-0 z-20 -mx-5 mb-3 flex flex-wrap items-center gap-3 border-y border-amber-200 bg-amber-50 px-5 py-2.5">
        {count > 0 ? (
          <>
            <span className="text-sm font-semibold text-neutral-800">{count}টি অর্ডার নির্বাচিত</span>
            <Button variant="danger" onClick={() => setConfirming(true)} disabled={pending}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {pending ? "মুছে ফেলা হচ্ছে…" : "নির্বাচিত অর্ডার মুছুন"}
            </Button>
            <Button variant="ghost" onClick={clear} disabled={pending}>
              নির্বাচন বাতিল
            </Button>
          </>
        ) : null}
        {message ? (
          <span role="status" className={`text-sm font-medium ${message.tone === "error" ? "text-red-700" : "text-green-700"}`}>
            {message.text}
          </span>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        title={`${count}টি অর্ডার মুছে ফেলবেন?`}
        message={`${preview} — এই অর্ডারগুলো স্থায়ীভাবে মুছে যাবে, আর ফেরত আনা যাবে না। (শুধু বাতিল করতে চাইলে স্ট্যাটাস "Cancelled" করুন।)`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={onDelete}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
