"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { formatTaka } from "@/lib/text";

// Gentle check before checkout: the same design is in the order more than once.
// Customers often bump the quantity by mistake when they only want one, so every piece is
// listed one by one with the price highlighted; they can keep it, keep one, or pick other designs.

const bn = (n) => Number(n).toLocaleString("bn-BD");
const noopSubscribe = () => () => {};

function SameDesignPopup({ repeated, onRemove, onYes, onKeepOne, onOtherDesigns, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!isClient) return null;

  const single = repeated.length === 1;
  const pieces = repeated.reduce((sum, item) => sum + item.quantity, 0);
  // Every extra piece removed with × -> nothing left to warn about, just let them order
  const allSingle = repeated.every((item) => item.quantity === 1);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <button type="button" aria-label="বন্ধ করুন" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="same-design-title"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl md:rounded-2xl"
      >
        <div className="px-5 pt-5 md:px-6 md:pt-6">
          <h2 id="same-design-title" className="pr-8 text-lg font-bold text-neutral-900">
            {allSingle ? "ঠিক আছে, এখন অর্ডার করতে পারেন" : single ? `একই ডিজাইন ${bn(pieces)}টি নিচ্ছেন?` : "একই ডিজাইন একাধিক নিচ্ছেন?"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100"
          >
            ×
          </button>
          <p className="mt-1 text-sm text-neutral-600">
            {allSingle
              ? "বাড়তি পিসগুলো বাদ দেওয়া হয়েছে।"
              : "অনেক সময় ভুল করে সংখ্যা বেড়ে যায়। একবার মিলিয়ে নিন। ভুল হলে × চেপে বাড়তি পিস বাদ দিন।"}
          </p>
        </div>

        {/* Every piece on its own row, in order */}
        <div className="mt-4 flex-1 space-y-4 overflow-y-auto px-5 md:px-6">
          {repeated.map((item) => (
            <div key={item.id}>
              <ol className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {Array.from({ length: item.quantity }, (_, index) => (
                  <li key={index} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="w-5 shrink-0 text-center font-semibold text-neutral-500">{bn(index + 1)}</span>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-md bg-neutral-100" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-neutral-800">{item.name}</span>
                    <span className="shrink-0 text-neutral-700">{formatTaka(item.price)}</span>
                    {/* Remove one piece; the last piece stays (remove the whole product from the cart instead) */}
                    <button
                      type="button"
                      data-track="same-design-remove"
                      onClick={() => onRemove(item.id)}
                      disabled={item.quantity <= 1}
                      aria-label={`${item.name}: এই পিসটি বাদ দিন`}
                      title={item.quantity <= 1 ? "অন্তত ১টি থাকবে" : "এই পিসটি বাদ দিন"}
                      className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
                {item.quantity > 1 ? "একই ডিজাইনের " : ""}<b className="text-base">{bn(item.quantity)}টি</b> পিস, মোট{" "}
                <b className="text-base">{formatTaka(Number(item.price) * item.quantity)}</b>
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-6">
          <button
            type="button"
            data-track="same-design-yes"
            onClick={onYes}
            className="w-full rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            {allSingle ? "অর্ডার করুন" : single ? `হ্যাঁ, ${bn(pieces)}টিই নিতে চাই` : "হ্যাঁ, এভাবেই নিতে চাই"}
          </button>
          {allSingle ? null : (
            <button
              type="button"
              data-track="same-design-keep-one"
              onClick={onKeepOne}
              className="w-full rounded-full border-2 border-black px-5 py-3 font-semibold text-black transition hover:bg-neutral-100"
            >
              {single ? "১টি নিয়ে অর্ডার করুন" : "প্রতিটি ১টি করে নিয়ে অর্ডার করুন"}
            </button>
          )}
          <p className="text-center text-sm text-neutral-600">
            ভিন্ন ডিজাইন নিতে চান?{" "}
            <button
              type="button"
              data-track="same-design-other"
              onClick={onOtherDesigns}
              className="font-semibold text-neutral-900 underline underline-offset-2"
            >
              অন্য ডিজাইন বেছে নিন
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// items: [{ id, name, image, price, quantity }]
// onProceed(): continue to checkout as is. onKeepOne(ids): set those items to 1 (then checkout follows).
// onOtherDesigns(ids): set those items to 1 and help the customer pick other designs.
// onSetQuantity(id, quantity): the × button removed one piece — save the new quantity.
// Returns [check(items), popup].
export function useSameDesignCheck({ onProceed, onKeepOne, onOtherDesigns, onSetQuantity }) {
  const [repeated, setRepeated] = useState(null);

  function check(items) {
    const many = (items ?? []).filter((item) => item.quantity > 1);
    if (many.length > 0) setRepeated(many);
    else onProceed();
  }

  const ids = (repeated ?? []).map((item) => item.id);
  const popup = repeated ? (
    <SameDesignPopup
      repeated={repeated}
      onRemove={(id) => {
        const item = repeated.find((entry) => entry.id === id);
        if (!item || item.quantity <= 1) return;
        const quantity = item.quantity - 1;
        setRepeated(repeated.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)));
        onSetQuantity(id, quantity);
      }}
      onClose={() => setRepeated(null)}
      onYes={() => {
        setRepeated(null);
        onProceed();
      }}
      onKeepOne={() => {
        setRepeated(null);
        onKeepOne(ids);
        onProceed();
      }}
      onOtherDesigns={() => {
        setRepeated(null);
        onOtherDesigns(ids);
      }}
    />
  ) : null;

  return [check, popup];
}
