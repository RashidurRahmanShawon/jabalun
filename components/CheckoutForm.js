"use client";

import { useState } from "react";
import { readSource } from "@/lib/order-source";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { formatTaka } from "@/lib/text";
import { calcDiscount, DISCOUNT_LABEL } from "@/lib/discount";
import DuplicateWarning, { isDuplicateAcknowledged, setDuplicateAcknowledged } from "@/components/DuplicateWarning";

const GENERIC_ERROR = "দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। একটু পরে আবার চেষ্টা করুন।";
const MAX_NOTE = 300;

function validate({ name, address, phone, note }) {
  const errors = {};
  if (!name.trim()) errors.name = "নাম লিখুন।";
  else if (name.trim().length > 100) errors.name = "নাম ১০০ অক্ষরের মধ্যে লিখুন।";
  if (!address.trim()) errors.address = "ঠিকানা লিখুন।";
  else if (address.trim().length > 300) errors.address = "ঠিকানা ৩০০ অক্ষরের মধ্যে লিখুন।";
  if (!phone.trim()) errors.phone = "মোবাইল নম্বর লিখুন।";
  else if (!isValidPhone(phone)) errors.phone = "সঠিক ১১ সংখ্যার নম্বর দিন (যেমন 01XXXXXXXXX)।";
  if (note.trim().length > MAX_NOTE) errors.note = "নোট ৩০০ অক্ষরের মধ্যে লিখুন।";
  return errors;
}

const INPUT =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none focus:border-black focus:ring-1 focus:ring-black";
const CARD = "rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6";

// Order lines + totals; prices are a preview, /api/order recalculates from WooCommerce
export function OrderSummary({ items }) {
  const { subtotal, discount, total } = calcDiscount(items);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-neutral-500">
          <th className="pb-2 font-medium">পণ্য</th>
          <th className="pb-2 text-right font-medium">মূল্য</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="py-2 pr-3 text-neutral-800">
              {item.name} × {item.quantity.toLocaleString("bn-BD")}
            </td>
            <td className="py-2 text-right text-neutral-800">
              {formatTaka(Number(item.price || 0) * item.quantity)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="border-t border-neutral-200 text-neutral-700">
        <tr>
          <td className="pt-3">সাবটোটাল</td>
          <td className="pt-3 text-right">{formatTaka(subtotal)}</td>
        </tr>
        {discount > 0 ? (
          <tr className="text-green-700">
            <td className="pt-2">{DISCOUNT_LABEL}</td>
            <td className="pt-2 text-right">−{formatTaka(discount)}</td>
          </tr>
        ) : null}
        <tr>
          <td className="pt-2">শিপিং</td>
          <td className="pt-2 text-right">ফ্রি ডেলিভারি</td>
        </tr>
        <tr className="text-base font-bold text-neutral-900">
          <td className="pt-3">মোট</td>
          <td className="pt-3 text-right">{formatTaka(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// Name, address, phone, optional note → POST /api/order → thank-you page.
// layout "stacked": fields only (used inside CheckoutPanel, which shows its own summary).
// layout "split": billing card + order summary card side by side (inline checkout).
export default function CheckoutForm({
  items,
  onSuccess,
  onSubmittingChange,
  nameInputRef,
  layout = "stacked",
  idPrefix = "checkout",
  submitLabel = "অর্ডার নিশ্চিত করুন",
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", phone: "", note: "", website: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmittingState] = useState(false);
  // Server said this phone ordered in the last 60 minutes: { orders, warningInactive }
  const [duplicate, setDuplicate] = useState(null);

  function setSubmitting(value) {
    setSubmittingState(value);
    onSubmittingChange?.(value);
  }

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || items.length === 0) return;

    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    await placeOrder();
  }

  async function placeOrder() {
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
          note: form.note.trim(),
          website: form.website,
          source: readSource(),
          ...(isDuplicateAcknowledged() && { acknowledgedDuplicate: true }),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.duplicate) {
        setDuplicate({ orders: data.orders ?? [], warningInactive: Boolean(data.warningInactive) });
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.id || !data.order_key) {
        setServerError(data.error || GENERIC_ERROR);
        setSubmitting(false);
        return;
      }

      onSuccess?.();
      // Stay disabled while navigating so the order can't be sent twice
      const params = new URLSearchParams({ order: String(data.id), key: data.order_key });
      if (data.warningInactive) params.set("notice", "retry");
      router.push(`/thank-you?${params}`);
    } catch {
      setServerError(GENERIC_ERROR);
      setSubmitting(false);
    }
  }

  const id = (name) => `${idPrefix}-${name}`;
  const errorText = (field) =>
    errors[field] ? <p className="mt-1 text-sm text-red-600">{errors[field]}</p> : null;

  const fields = (
    <div className="space-y-4">
      <div>
        <label htmlFor={id("name")} className="text-sm font-medium text-neutral-800">
          সম্পূর্ণ নাম *
        </label>
        <input
          ref={nameInputRef}
          id={id("name")}
          type="text"
          autoComplete="name"
          maxLength={100}
          value={form.name}
          onChange={update("name")}
          aria-invalid={Boolean(errors.name)}
          className={INPUT}
        />
        {errorText("name")}
      </div>

      <div>
        <label htmlFor={id("address")} className="text-sm font-medium text-neutral-800">
          বিস্তারিত ঠিকানা *
        </label>
        <textarea
          id={id("address")}
          rows={3}
          autoComplete="street-address"
          maxLength={300}
          placeholder="বাসা/রোড, এলাকা, থানা, জেলা"
          value={form.address}
          onChange={update("address")}
          aria-invalid={Boolean(errors.address)}
          className={INPUT}
        />
        {errorText("address")}
      </div>

      <div>
        <label htmlFor={id("phone")} className="text-sm font-medium text-neutral-800">
          মোবাইল নম্বর *
        </label>
        <input
          id={id("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          value={form.phone}
          onChange={update("phone")}
          aria-invalid={Boolean(errors.phone)}
          className={INPUT}
        />
        {errorText("phone")}
      </div>

      <div>
        <label htmlFor={id("note")} className="text-sm font-medium text-neutral-800">
          অর্ডার নোট (ঐচ্ছিক)
        </label>
        <textarea
          id={id("note")}
          rows={2}
          maxLength={MAX_NOTE}
          placeholder="অর্ডার সম্পর্কে কিছু জানাতে চাইলে লিখুন, যেমন ডেলিভারির বিশেষ নির্দেশনা।"
          value={form.note}
          onChange={update("note")}
          aria-invalid={Boolean(errors.note)}
          className={INPUT}
        />
        {errorText("note")}
      </div>

      {/* Honeypot: hidden from people, bots tend to fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input
          id={id("website")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={update("website")}
        />
      </div>
    </div>
  );

  const payment = (
    <div className="space-y-1 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
      <p>
        <span className="font-semibold">পেমেন্ট:</span> ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।
      </p>
      <p>
        <span className="font-semibold">ডেলিভারি:</span> সম্পূর্ণ বাংলাদেশে ফ্রি ডেলিভারি
      </p>
    </div>
  );

  const submit = (
    <>
      <DuplicateWarning
        open={duplicate !== null}
        orders={duplicate?.orders}
        warningInactive={duplicate?.warningInactive}
        onClose={() => setDuplicate(null)}
        onConfirm={() => {
          setDuplicateAcknowledged(true);
          setDuplicate(null);
          placeOrder();
        }}
      />
      {serverError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting || items.length === 0}
        className="w-full rounded-full bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "অর্ডার পাঠানো হচ্ছে…" : submitLabel}
      </button>
    </>
  );

  if (layout === "split") {
    return (
      <form onSubmit={handleSubmit} noValidate className="relative grid gap-6 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className="mb-4 text-lg font-bold text-neutral-900">বিলিং তথ্য</h2>
          {fields}
        </div>
        <div className="space-y-6">
          <div className={CARD}>
            <h2 className="mb-4 text-lg font-bold text-neutral-900">অর্ডারের বিবরণ</h2>
            {items.length > 0 ? (
              <OrderSummary items={items} />
            ) : (
              <p className="text-sm text-neutral-500">এখনো কোনো ডিজাইন বেছে নেওয়া হয়নি।</p>
            )}
          </div>
          <div className={`${CARD} space-y-4`}>
            {payment}
            <p className="text-xs leading-relaxed text-neutral-500">
              আপনার তথ্য শুধু অর্ডার প্রক্রিয়া ও ডেলিভারির জন্য ব্যবহার করা হবে। বিস্তারিত দেখুন{" "}
              <Link href="/privacy" className="underline">
                গোপনীয়তা নীতি
              </Link>
              ।
            </p>
            {submit}
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative mt-5 space-y-4">
      {fields}
      {payment}
      {submit}
    </form>
  );
}
