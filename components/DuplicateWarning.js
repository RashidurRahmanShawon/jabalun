"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SITE } from "@/lib/site";
import { normalizePhone } from "@/lib/phone";
import { formatTaka } from "@/lib/text";

// Duplicate-order warning: popup + the browser-side record of recent orders.
// localStorage holds only order number, time, item name/image/quantity and total —
// never the customer's name, address or phone.

const STORAGE_KEY = "jabalun_recent_orders";
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 10;
const CONTACT_PHONE = normalizePhone(SITE.phone); // 01707406132
const CONTACT_HREF = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;
const INACTIVE_MESSAGE = `আপনি আগে একবার অর্ডার করার চেষ্টা করেছিলেন। অর্ডার করতে কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন: ${CONTACT_PHONE}।`;

function isRecent(entry) {
  const time = Date.parse(entry?.date || "");
  return !Number.isNaN(time) && Date.now() - time < WINDOW_MS;
}

// Orders from the last 60 minutes; older entries are removed while reading
export function getRecentOrders() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const list = Array.isArray(raw) ? raw : [];
    const recent = list.filter(isRecent);
    if (recent.length !== list.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    return recent;
  } catch {
    return [];
  }
}

export function saveRecentOrder(summary) {
  try {
    const entry = {
      number: summary.number,
      date: summary.date,
      items: (summary.items || []).map(({ name, image, quantity }) => ({ name, image, quantity })),
      total: summary.total,
    };
    if (!isRecent(entry)) return;
    const others = getRecentOrders().filter((order) => String(order.number) !== String(entry.number));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...others].slice(0, MAX_ENTRIES)));
  } catch {
    // Storage blocked or full: the server-side check still works
  }
}

// "Yes, order again" — read by CheckoutForm when it sends the order
let acknowledged = false;
export function setDuplicateAcknowledged(value) {
  acknowledged = value;
}
export function isDuplicateAcknowledged() {
  return acknowledged;
}

const noopSubscribe = () => () => {};

function orderTime(raw) {
  const ms = Date.parse(raw || "");
  if (Number.isNaN(ms)) return "";
  const date = new Date(ms);
  const day = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(date);
  const time = new Intl.DateTimeFormat("bn-BD", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(date);
  return `${day}, ${time}`; // ১৫ নভেম্বর, ৩:৫০ PM
}

// mode "duplicate": recent order found -> contact / order again.
// mode "inactive": order went through, but an earlier attempt was cancelled/failed -> message only.
export default function DuplicateWarning({ open, orders = [], warningInactive = false, mode = "duplicate", onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Rendered into <body> so a transformed parent (the checkout panel) can't clip it
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!open || !isClient) return null;
  const inactiveOnly = mode === "inactive";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <button type="button" aria-label="বন্ধ করুন" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="duplicate-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:rounded-2xl md:p-6"
      >
        <h2 id="duplicate-title" className="pr-8 text-lg font-bold text-neutral-900">
          {inactiveOnly ? "একটি বিষয় জানিয়ে রাখি" : "আপনি সম্প্রতি একটি অর্ডার করেছেন"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100"
        >
          ×
        </button>

        {inactiveOnly ? null : (
          <p className="mt-2 text-sm text-neutral-600">
            {orders.length > 0
              ? "গত ৬০ মিনিটের মধ্যে নিচের অর্ডারটি করা হয়েছে। একই পণ্য ভুল করে আবার অর্ডার হচ্ছে কি না দেখে নিন।"
              : "এই মোবাইল নম্বর থেকে গত ৬০ মিনিটের মধ্যে একটি অর্ডার এসেছে। একই পণ্য ভুল করে আবার অর্ডার হচ্ছে কি না দেখে নিন।"}
          </p>
        )}

        {!inactiveOnly && orders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.number} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-neutral-900">অর্ডার #{order.number}</span>
                  <span className="text-neutral-500">{orderTime(order.date)}</span>
                </div>
                <ul className="mt-2 space-y-2">
                  {(order.items || []).map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-11 w-11 shrink-0 rounded-lg bg-neutral-100" aria-hidden="true" />
                      )}
                      <span className="flex-1 text-neutral-800">{item.name}</span>
                      <span className="text-neutral-600">× {Number(item.quantity).toLocaleString("bn-BD")}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-semibold text-neutral-900">
                  <span>মোট দাম</span>
                  <span>{formatTaka(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {warningInactive || inactiveOnly ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{INACTIVE_MESSAGE}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href={CONTACT_HREF}
            data-track="duplicate-contact"
            className="flex-1 rounded-full border-2 border-black px-5 py-3 text-center font-semibold text-black transition hover:bg-neutral-100"
          >
            যোগাযোগ করুন
          </a>
          <button
            type="button"
            data-track={inactiveOnly ? "duplicate-ok" : "duplicate-confirm"}
            onClick={inactiveOnly ? onClose : onConfirm}
            className="flex-1 rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            {inactiveOnly ? "ঠিক আছে" : "হ্যাঁ, আবার অর্ডার করতে চাই"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// For "buy now" / "order" buttons: checks the browser's recent orders before opening checkout.
// Returns [requestCheckout, popup] — render the popup next to the button.
export function useDuplicateGate(openCheckout) {
  const [recent, setRecent] = useState(null);

  function requestCheckout() {
    setDuplicateAcknowledged(false);
    const orders = getRecentOrders();
    if (orders.length > 0) setRecent(orders);
    else openCheckout();
  }

  const popup = (
    <DuplicateWarning
      open={recent !== null}
      orders={recent ?? []}
      onClose={() => setRecent(null)}
      onConfirm={() => {
        setDuplicateAcknowledged(true);
        setRecent(null);
        openCheckout();
      }}
    />
  );

  return [requestCheckout, popup];
}

// Thank-you page: remembers the order in this browser and shows the cancelled/failed-attempt note
export function RecentOrderRecorder({ summary, showInactiveNotice = false }) {
  const [noticeOpen, setNoticeOpen] = useState(showInactiveNotice);

  useEffect(() => {
    saveRecentOrder(summary);
    setDuplicateAcknowledged(false);
  }, [summary]);

  return <DuplicateWarning open={noticeOpen} mode="inactive" onClose={() => setNoticeOpen(false)} />;
}
