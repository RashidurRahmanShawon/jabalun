"use client";

import { useEffect, useState } from "react";
import { addToCart, MAX_ITEMS, MAX_QTY } from "@/lib/cart";
import CheckoutPanel from "./CheckoutPanel";

const NOTICES = {
  added: () => "✓ কার্টে যোগ হয়েছে।",
  increased: (qty) => `✓ কার্টে যোগ হয়েছে (মোট ${qty.toLocaleString("bn-BD")}টি)।`,
  max: () => `একটি পণ্য সর্বোচ্চ ${MAX_QTY.toLocaleString("bn-BD")}টি অর্ডার করা যায়।`,
  full: () => `কার্টে সর্বোচ্চ ${MAX_ITEMS.toLocaleString("bn-BD")}টি ভিন্ন পণ্য রাখা যায়।`,
};

export default function ProductActions({ product, inStock }) {
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleAddToCart() {
    try {
      const { status, quantity } = addToCart(product);
      setNotice(NOTICES[status](quantity));
    } catch {
      setNotice("কার্টে যোগ করা যায়নি। ব্রাউজারের স্টোরেজ বন্ধ থাকতে পারে।");
    }
  }

  if (!inStock) {
    return (
      <p className="rounded-lg border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-500">
        স্টকে নেই
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-track="add-to-cart"
          onClick={handleAddToCart}
          className="flex-1 rounded-full border-2 border-black px-6 py-3 font-semibold text-black transition hover:bg-neutral-100"
        >
          কার্টে যোগ করুন
        </button>
        <button
          type="button"
          data-track="buy-now"
          onClick={() => setCheckoutOpen(true)}
          className="flex-1 rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          এখনই কিনুন
        </button>
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-sm font-medium text-green-700">
        {notice}
      </p>

      {/* "Buy now" orders just this product and leaves the cart untouched */}
      <CheckoutPanel
        items={[
          { id: product.id, name: product.name, price: product.price, quantity: 1, eligible: product.hijab },
        ]}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
