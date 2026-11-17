"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { clearCart, MAX_QTY, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { formatTaka } from "@/lib/text";
import { calcDiscount, DISCOUNT_LABEL } from "@/lib/discount";
import CheckoutPanel from "@/app/product/[slug]/CheckoutPanel";
import { useRouter } from "next/navigation";
import { useDuplicateGate } from "@/components/DuplicateWarning";
import { useSameDesignCheck } from "@/components/SameDesignWarning";

const STORAGE_ERROR = "কার্ট আপডেট করা যায়নি। ব্রাউজারের স্টোরেজ বন্ধ থাকতে পারে।";

// Fetches current price/stock so the cart never shows a stale price.
// Returns null while loading, or a Map(id -> { price, inStock }); missing id = unavailable.
function useLivePrices(ids) {
  const key = ids.join(",");
  const [result, setResult] = useState({ key: "", live: null });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/cart?ids=${key}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!cancelled) setResult({ key, live: new Map(data.items.map((item) => [item.id, item])) });
      })
      // On failure keep showing stored prices; /api/order still re-checks everything
      .catch(() => {
        if (!cancelled) setResult({ key, live: new Map(), failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return result.key === key ? result : { live: null };
}

export default function CartView() {
  const items = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Asks first when this browser placed an order in the last 60 minutes
  const [requestCheckout, duplicatePopup] = useDuplicateGate(() => setCheckoutOpen(true));
  const router = useRouter();
  // Same design more than once? Show every piece and the price before checkout
  const [checkSameDesign, sameDesignPopup] = useSameDesignCheck({
    onProceed: requestCheckout,
    onKeepOne: (ids) => run(() => ids.forEach((id) => setQuantity(id, 1))),
    onSetQuantity: (id, quantity) => run(() => setQuantity(id, quantity)),
    onOtherDesigns: (ids) => {
      run(() => ids.forEach((id) => setQuantity(id, 1)));
      router.push("/shop");
    },
  });
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);
  const { live, failed } = useLivePrices((items ?? []).map((item) => item.id));

  function run(action) {
    try {
      setError("");
      action();
    } catch {
      setError(STORAGE_ERROR);
    }
  }

  if (items === null) {
    return <p className="mt-8 text-neutral-500">কার্ট লোড হচ্ছে…</p>;
  }

  // Cart is cleared right after a successful order, before the thank-you page loads
  if (placed) {
    return <p className="mt-8 text-neutral-600">✓ অর্ডার নিশ্চিত হয়েছে। একটু অপেক্ষা করুন…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-neutral-200 py-14 text-center">
        <p className="text-lg text-neutral-600">আপনার কার্ট খালি।</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-black px-8 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          শপে যান
        </Link>
      </div>
    );
  }

  const rows = items.map((item) => {
    const current = live && !failed ? live.get(item.id) : undefined;
    const unavailable = Boolean(live && !failed && (!current || !current.inStock));
    const price = current?.price || item.price;
    const eligible = current ? current.eligible : item.hijab;
    return { ...item, price, eligible, unavailable };
  });
  const orderable = rows.filter((row) => !row.unavailable);
  const { subtotal, discount, total } = calcDiscount(orderable);

  return (
    <>
      <ul className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
        {rows.map((row) => (
          <li key={row.id} className={`flex gap-4 p-4 ${row.unavailable ? "opacity-60" : ""}`}>
            <Link
              href={`/product/${row.slug}`}
              className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:w-24"
            >
              {row.image ? (
                <Image src={row.image} alt={row.name} fill sizes="96px" className="object-cover" />
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/product/${row.slug}`}
                  className="line-clamp-2 font-medium text-neutral-900 hover:underline"
                >
                  {row.name}
                </Link>
                <button
                  type="button"
                  data-track="cart-remove"
                  onClick={() => run(() => removeFromCart(row.id))}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  সরান
                </button>
              </div>

              <p className="text-sm text-neutral-600">মূল্য: {formatTaka(row.price)}</p>

              {row.unavailable ? (
                <p className="text-sm font-semibold text-red-600">এই মুহূর্তে স্টকে নেই</p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-neutral-300">
                    <button
                      type="button"
                      aria-label="পরিমাণ কমান"
                      disabled={row.quantity <= 1}
                      onClick={() => run(() => setQuantity(row.id, row.quantity - 1))}
                      className="h-9 w-9 rounded-full text-lg disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold" aria-live="polite">
                      {row.quantity.toLocaleString("bn-BD")}
                    </span>
                    <button
                      type="button"
                      aria-label="পরিমাণ বাড়ান"
                      disabled={row.quantity >= MAX_QTY}
                      onClick={() => run(() => setQuantity(row.id, row.quantity + 1))}
                      className="h-9 w-9 rounded-full text-lg disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-neutral-900">
                    {formatTaka(Number(row.price || 0) * row.quantity)}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
        {discount > 0 ? (
          <div className="mb-2 space-y-1 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>পণ্যের মূল্য</span>
              <span>{formatTaka(subtotal)}</span>
            </div>
            <div className="flex justify-between font-medium text-green-700">
              <span>{DISCOUNT_LABEL}</span>
              <span>−{formatTaka(discount)}</span>
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-neutral-900">মোট মূল্য</span>
          <span className="font-bold text-neutral-900">{formatTaka(total)}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          ক্যাশ অন ডেলিভারি • সম্পূর্ণ বাংলাদেশে ফ্রি ডেলিভারি
        </p>
        {orderable.length < rows.length ? (
          <p className="mt-2 text-sm text-red-600">স্টকে না থাকা পণ্য অর্ডারে যোগ হবে না।</p>
        ) : null}
        <button
          type="button"
          disabled={orderable.length === 0 || live === null}
          data-track="cart-checkout"
          onClick={() => checkSameDesign(orderable)}
          className="mt-5 w-full rounded-full bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {live === null ? "দাম যাচাই হচ্ছে…" : "অর্ডার করুন"}
        </button>
      </div>

      <CheckoutPanel
        items={orderable.map(({ id, name, image, price, quantity, eligible }) => ({ id, name, image, price, quantity, eligible }))}
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
      {sameDesignPopup}
      {duplicatePopup}
    </>
  );
}
