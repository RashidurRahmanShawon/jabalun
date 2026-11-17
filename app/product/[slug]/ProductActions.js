"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_ITEMS, MAX_QTY, readCart, setItemQuantity } from "@/lib/cart";
import CheckoutPanel from "./CheckoutPanel";
import { useDuplicateGate } from "@/components/DuplicateWarning";
import { useSameDesignCheck } from "@/components/SameDesignWarning";

const bn = (n) => n.toLocaleString("bn-BD");

const NOTICES = {
  added: (qty) => (qty > 1 ? `✓ ${bn(qty)}টি কার্টে যোগ হয়েছে।` : "✓ কার্টে যোগ হয়েছে।"),
  increased: (qty) => `✓ কার্টে যোগ হয়েছে (মোট ${bn(qty)}টি)।`,
  max: () => `একটি পণ্য সর্বোচ্চ ${MAX_QTY.toLocaleString("bn-BD")}টি অর্ডার করা যায়।`,
  full: () => `কার্টে সর্বোচ্চ ${MAX_ITEMS.toLocaleString("bn-BD")}টি ভিন্ন পণ্য রাখা যায়।`,
};

export default function ProductActions({ product, inStock }) {
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quantity, setQty] = useState(1);
  const router = useRouter();
  // Asks first when this browser placed an order in the last 60 minutes
  const [requestCheckout, duplicatePopup] = useDuplicateGate(() => setCheckoutOpen(true));
  // "Buy now" with more than one piece: show every piece and the price first
  const [checkSameDesign, sameDesignPopup] = useSameDesignCheck({
    onProceed: requestCheckout,
    onKeepOne: () => setQty(1),
    onSetQuantity: (_id, next) => setQty(next),
    onOtherDesigns: () => {
      setQty(1);
      router.push("/shop");
    },
  });

  function changeQty(next) {
    setQty(Math.max(1, Math.min(MAX_QTY, next)));
  }

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Adds the chosen number of pieces on top of what is already in the cart
  function handleAddToCart() {
    try {
      const existing = readCart().find((item) => item.id === product.id)?.quantity ?? 0;
      if (existing >= MAX_QTY) {
        setNotice(NOTICES.max());
        return;
      }
      const total = Math.min(MAX_QTY, existing + quantity);
      if (setItemQuantity(product, total) === "full") {
        setNotice(NOTICES.full());
        return;
      }
      setNotice(
        existing + quantity > MAX_QTY
          ? `${NOTICES.increased(total)} ${NOTICES.max()}`
          : existing > 0
            ? NOTICES.increased(total)
            : NOTICES.added(total)
      );
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
      <div className="mb-4 flex items-center gap-3">
        <span id="product-qty-label" className="text-sm font-medium text-neutral-800">
          পরিমাণ
        </span>
        <div
          role="group"
          aria-labelledby="product-qty-label"
          className="inline-flex items-center rounded-full border border-neutral-300"
        >
          <button
            type="button"
            aria-label="পরিমাণ কমান"
            disabled={quantity <= 1}
            onClick={() => changeQty(quantity - 1)}
            className="h-10 w-10 rounded-full text-lg disabled:opacity-30"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold" aria-live="polite">
            {bn(quantity)}
          </span>
          <button
            type="button"
            aria-label="পরিমাণ বাড়ান"
            disabled={quantity >= MAX_QTY}
            onClick={() => changeQty(quantity + 1)}
            className="h-10 w-10 rounded-full text-lg disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

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
          onClick={() =>
            checkSameDesign([
              { id: product.id, name: product.name, image: product.image, price: product.price, quantity },
            ])
          }
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
          { id: product.id, name: product.name, image: product.image, price: product.price, quantity, eligible: product.hijab },
        ]}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
      {sameDesignPopup}
      {duplicatePopup}
    </>
  );
}
