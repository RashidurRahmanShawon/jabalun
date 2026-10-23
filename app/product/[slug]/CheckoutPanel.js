"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { formatTaka } from "@/lib/text";

const GENERIC_ERROR = "দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। একটু পরে আবার চেষ্টা করুন।";

function validate({ name, address, phone }) {
  const errors = {};
  if (!name.trim()) errors.name = "নাম লিখুন।";
  else if (name.trim().length > 100) errors.name = "নাম ১০০ অক্ষরের মধ্যে লিখুন।";
  if (!address.trim()) errors.address = "ঠিকানা লিখুন।";
  else if (address.trim().length > 300) errors.address = "ঠিকানা ৩০০ অক্ষরের মধ্যে লিখুন।";
  if (!phone.trim()) errors.phone = "মোবাইল নম্বর লিখুন।";
  else if (!isValidPhone(phone)) errors.phone = "সঠিক ১১ সংখ্যার নম্বর দিন (যেমন 01XXXXXXXXX)।";
  return errors;
}

const INPUT =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-black focus:ring-1 focus:ring-black";

// items: [{ id, name, price, quantity }] — one product ("buy now") or the whole cart.
// Prices here are only a preview; WooCommerce calculates the real total.
export default function CheckoutPanel({ items, open, onClose, onSuccess }) {
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const router = useRouter();
  const nameRef = useRef(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", website: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
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

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          name: form.name.trim(),
          address: form.address.trim(),
          phone: normalizePhone(form.phone),
          website: form.website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.id || !data.order_key) {
        setServerError(data.error || GENERIC_ERROR);
        setSubmitting(false);
        return;
      }

      onSuccess?.();
      // Stay disabled while navigating so the order can't be sent twice
      const params = new URLSearchParams({ order: String(data.id), key: data.order_key });
      router.push(`/thank-you?${params}`);
    } catch {
      setServerError(GENERIC_ERROR);
      setSubmitting(false);
    }
  }

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
            <ul className="mt-1 space-y-0.5 text-sm text-neutral-600">
              {items.map((item) => (
                <li key={item.id}>
                  {item.name}
                  {item.quantity > 1 ? ` × ${item.quantity.toLocaleString("bn-BD")}` : ""}
                  {item.price ? ` — ${formatTaka(Number(item.price) * item.quantity)}` : ""}
                </li>
              ))}
            </ul>
            {items.length > 1 && total > 0 ? (
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

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="checkout-name" className="text-sm font-medium text-neutral-800">
              নাম *
            </label>
            <input
              ref={nameRef}
              id="checkout-name"
              type="text"
              autoComplete="name"
              maxLength={100}
              value={form.name}
              onChange={update("name")}
              aria-invalid={Boolean(errors.name)}
              className={INPUT}
            />
            {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="checkout-address" className="text-sm font-medium text-neutral-800">
              ঠিকানা *
            </label>
            <textarea
              id="checkout-address"
              rows={3}
              autoComplete="street-address"
              maxLength={300}
              placeholder="বাসা/রোড, এলাকা, থানা, জেলা"
              value={form.address}
              onChange={update("address")}
              aria-invalid={Boolean(errors.address)}
              className={INPUT}
            />
            {errors.address ? <p className="mt-1 text-sm text-red-600">{errors.address}</p> : null}
          </div>

          <div>
            <label htmlFor="checkout-phone" className="text-sm font-medium text-neutral-800">
              মোবাইল নম্বর *
            </label>
            <input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={update("phone")}
              aria-invalid={Boolean(errors.phone)}
              className={INPUT}
            />
            {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
          </div>

          {/* Honeypot: hidden from people, bots tend to fill it */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="checkout-website">Website</label>
            <input
              id="checkout-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={update("website")}
            />
          </div>

          <div className="space-y-1 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <p>
              <span className="font-semibold">পেমেন্ট:</span> ক্যাশ অন ডেলিভারি
            </p>
            <p>
              <span className="font-semibold">ডেলিভারি:</span> সম্পূর্ণ বাংলাদেশে ফ্রি ডেলিভারি
            </p>
          </div>

          {serverError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "অর্ডার পাঠানো হচ্ছে…" : "অর্ডার নিশ্চিত করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
