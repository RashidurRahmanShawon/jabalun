"use client";

import { useEffect, useRef, useState } from "react";
import { formatTaka } from "@/lib/text";
import { calcDiscount, DISCOUNT_LABEL } from "@/lib/discount";
import CheckoutForm from "@/components/CheckoutForm";

// Slide-up / modal checkout. The form and order submission live in CheckoutForm.
// items: [{ id, name, image, price, quantity, eligible }] — one product ("buy now") or the whole cart.
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
        <div className="flex items-center justify-between gap-4">
          <h2 id="checkout-title" className="text-xl font-bold text-neutral-900">
            অর্ডার করুন
          </h2>
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

        {/* What is being ordered: photo, name, quantity and price of every product */}
        <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  width={56}
                  height={72}
                  className="h-[72px] w-14 shrink-0 rounded-lg bg-neutral-100 object-cover"
                />
              ) : (
                <span className="h-[72px] w-14 shrink-0 rounded-lg bg-neutral-100" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-neutral-900">{item.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  পরিমাণ: {item.quantity.toLocaleString("bn-BD")}টি
                  {item.quantity > 1 && item.price ? ` × ${formatTaka(item.price)}` : ""}
                </p>
              </div>
              {item.price ? (
                <p className="shrink-0 text-base font-bold text-neutral-900">
                  {formatTaka(Number(item.price) * item.quantity)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        {/* Amount to pay, highlighted */}
        {total > 0 ? (
          <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            {discount > 0 ? (
              <div className="mb-1.5 space-y-0.5 text-sm">
                <p className="flex justify-between text-neutral-600">
                  <span>পণ্যের মূল্য</span>
                  <span className="line-through">{formatTaka(subtotal)}</span>
                </p>
                <p className="flex justify-between font-medium text-green-700">
                  <span>{DISCOUNT_LABEL}</span>
                  <span>−{formatTaka(discount)}</span>
                </p>
              </div>
            ) : null}
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-amber-900">মোট মূল্য</span>
              <span className="text-2xl font-bold text-amber-900">{formatTaka(total)}</span>
            </p>
            <p className="mt-0.5 text-xs text-amber-800">ডেলিভারি চার্জ ফ্রি · পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
          </div>
        ) : null}

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
