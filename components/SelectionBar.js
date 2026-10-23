"use client";

import { useState } from "react";
import { clearCart, useCart } from "@/lib/cart";
import { calcDiscount } from "@/lib/discount";
import { formatTaka } from "@/lib/text";
import CheckoutPanel from "@/app/product/[slug]/CheckoutPanel";

// Fixed bottom bar summarising the whole cart (jabalun_cart), with checkout in place
export default function SelectionBar() {
  const items = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center font-medium text-green-700">
        ✓ অর্ডার নিশ্চিত হয়েছে। একটু অপেক্ষা করুন…
      </div>
    );
  }
  if (!items || items.length === 0) return null;

  const checkoutItems = items.map(({ id, name, price, quantity, hijab }) => ({
    id,
    name,
    price,
    quantity,
    eligible: hijab,
  }));
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, discount, total } = calcDiscount(checkoutItems);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="text-sm text-neutral-600">মোট {count.toLocaleString("bn-BD")}টি</p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              {discount > 0 ? (
                <span className="text-sm text-neutral-400 line-through">{formatTaka(subtotal)}</span>
              ) : null}
              <span className="text-lg font-bold text-neutral-900">{formatTaka(total)}</span>
              {discount > 0 ? (
                <span className="text-xs font-semibold text-green-700">১০% ছাড়</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="shrink-0 rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            অর্ডার করুন
          </button>
        </div>
      </div>

      <CheckoutPanel
        items={checkoutItems}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => {
          setPlaced(true);
          try {
            clearCart();
          } catch {
            // Order already placed; a stale cart is harmless
          }
        }}
      />
    </>
  );
}
