"use client";

import { useState } from "react";
import { clearCart, useCart } from "@/lib/cart";
import CheckoutForm from "@/components/CheckoutForm";

// Checkout shown directly on the collection page, for everything in the cart
export default function InlineCheckout() {
  const items = useCart();
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-center font-medium text-green-700">
        ✓ অর্ডার নিশ্চিত হয়েছে। একটু অপেক্ষা করুন…
      </p>
    );
  }

  const checkoutItems = (items ?? []).map(({ id, name, price, quantity, hijab }) => ({
    id,
    name,
    price,
    quantity,
    eligible: hijab,
  }));

  return (
    <CheckoutForm
      items={checkoutItems}
      layout="split"
      idPrefix="inline-checkout"
      submitLabel="অর্ডার কনফার্ম করুন"
      onSuccess={() => {
        setPlaced(true);
        try {
          clearCart();
        } catch {
          // Order already placed; a stale cart is harmless
        }
      }}
    />
  );
}
