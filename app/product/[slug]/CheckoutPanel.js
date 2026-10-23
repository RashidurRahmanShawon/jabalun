"use client";

import { useEffect, useRef, useState } from "react";
import { formatTaka } from "@/lib/text";
import { calcDiscount, DISCOUNT_LABEL } from "@/lib/discount";
import CheckoutForm from "@/components/CheckoutForm";

// Slide-up / modal checkout. The form and order submission live in CheckoutForm.
// items: [{ id, name, price, quantity, eligible }] — one product ("buy now") or the whole cart.
// Prices and discount here are only a preview; /api/order recalculates both from WooCommerce.
export default function CheckoutPanel({ items, open, onClose, onSuccess }) {
  const { subtotal, discount, total } = calcDiscount(items);
  const nameRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center md:items-center ${
        open ? "visible" : "invisible"
      }`}
      inert={!open}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="বন্ধ করুন"
        tabIndex={-1}
        onClick={() => !submitting && onClose()}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl transition duration-300 md:rounded-2xl md:p-6 ${
          open ? "translate-y-0 opacity-100" : "translate-y-full opacity-100 md:translate-y-8 md:opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="checkout-title" className="text-xl font-bold text-neutral-900">
              অর্ডার করুন
            </h2>
            <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-sm text-neutral-600">
              {items.map((item) => (
                <li key={item.id}>
                  {item.name}
                  {item.quantity > 1 ? ` × ${item.quantity.toLocaleString("bn-BD")}` : ""}
                  {item.price ? ` — ${formatTaka(Number(item.price) * item.quantity)}` : ""}
                </li>
              ))}
            </ul>
            {discount > 0 ? (
              <div className="mt-2 space-y-0.5 text-sm">
                <p className="text-neutral-500">
                  মোট: <span className="line-through">{formatTaka(subtotal)}</span>
                </p>
                <p className="font-medium text-green-700">
                  {DISCOUNT_LABEL}: −{formatTaka(discount)}
                </p>
                <p className="font-semibold text-neutral-900">ছাড়ের পর মোট: {formatTaka(total)}</p>
              </div>
            ) : items.length > 1 && total > 0 ? (
              <p className="mt-1 text-sm font-semibold text-neutral-900">মোট: {formatTaka(total)}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="বন্ধ করুন"
            className="rounded-full p-1 text-2xl leading-none text-neutral-500 hover:text-black disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <CheckoutForm
          items={items}
          onSuccess={onSuccess}
          onSubmittingChange={setSubmitting}
          nameInputRef={nameRef}
        />
      </div>
    </div>
  );
}
