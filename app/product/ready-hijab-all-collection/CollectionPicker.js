"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { clearCart, MAX_ITEMS, MAX_QTY, readCart, setItemQuantity, setQuantity, useCart } from "@/lib/cart";
import { SITE, hasValue } from "@/lib/site";
import { DISCOUNT_MIN_QTY } from "@/lib/discount";
import { useDuplicateGate } from "@/components/DuplicateWarning";
import { useSameDesignCheck } from "@/components/SameDesignWarning";

// Checkout code is downloaded only when "order" is pressed for the first time
const CheckoutPanel = dynamic(() => import("@/app/product/[slug]/CheckoutPanel"), { ssr: false });

const INITIAL_VISIBLE = 40;
const EAGER_THUMBS = 10; // first two rows (5 per row on desktop)
const GOLD = "#b8860b";
// Latin digits on purpose: the Bangla "১" is hard to read at button size in this font
const bn = (n) => String(n);

function label(design) {
  return design.number !== null ? String(design.number) : design.name || "ডিজাইন";
}

function toCartProduct(design) {
  const { id, slug, name, price, image } = design;
  return { id, slug, name, price, image, hijab: true };
}

function ZoomDialog({ design, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`ডিজাইন ${label(design)}`} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 bg-black/80" />
      <div className="relative w-full max-w-lg">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200">
          <Image src={design.image} alt={`ডিজাইন ${label(design)}`} fill sizes="(min-width: 640px) 512px, 92vw" className="object-cover" />
        </div>
        <p className="mt-3 text-center text-2xl font-bold text-white">{label(design)}</p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="বন্ধ করুন"
          className="absolute -top-3 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl leading-none text-black shadow"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Cream placeholder with the design number; the photo fades in over it once loaded.
// With no image URL only the placeholder is shown.
function FadeImage({ design, width, height, sizes, quality, loading, fetchPriority, numberClass }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center bg-[#fbf5e6] font-bold text-[#b8860b]/60 ${numberClass}`}
      >
        {label(design)}
      </span>
      {design.image ? (
        <Image
          src={design.image}
          alt={`ডিজাইন ${label(design)}`}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          className={`relative h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </>
  );
}

// Highest total the "how many" stepper allows (pieces, across all designs)
const MAX_PIECES = 100;

// "Pick how many pieces, then tap designs" — a tap adds 1 piece of that design to jabalun_cart;
// the stepper next to "order" changes the pieces of the design shown in the main image.
export default function CollectionPicker({ designs, title, price }) {
  const items = useCart();
  const [chosenTarget, setChosenTarget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [zoomed, setZoomed] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [message, setMessage] = useState("");
  // Snapshot of the cart taken when the popup opens, so it stays stable while ordering
  const [checkoutItems, setCheckoutItems] = useState(null);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);

  const designIds = new Set(designs.map((design) => design.id));
  const selected = (items ?? []).filter((item) => designIds.has(item.id));
  const quantityOf = new Map(selected.map((item) => [item.id, item.quantity]));
  const selectedIds = new Set(quantityOf.keys());
  const selectedPieces = selected.reduce((sum, item) => sum + item.quantity, 0);

  const maxTarget = MAX_PIECES;
  const target = chosenTarget ?? Math.max(1, selectedPieces);

  const active =
    designs.find((design) => design.id === activeId) ??
    designs.find((design) => selectedIds.has(design.id)) ??
    designs[0];
  const visible = showAll ? designs : designs.slice(0, INITIAL_VISIBLE);
  const hiddenCount = designs.length - visible.length;

  function run(action) {
    try {
      action();
    } catch {
      setMessage("নির্বাচন সংরক্ষণ করা যায়নি। ব্রাউজারের স্টোরেজ বন্ধ থাকতে পারে।");
    }
  }

  function chooseTarget(value) {
    setChosenTarget(Math.max(1, Math.min(maxTarget, value)));
    setMessage("");
  }

  function toggle(design) {
    setActiveId(design.id);
    setMessage("");

    run(() => {
      if (selectedIds.has(design.id)) {
        setItemQuantity(design, 0);
        return;
      }
      if (selectedPieces >= target) {
        if (target === 1) {
          // Single pick: swap the previous design for this one
          for (const item of readCart().filter((entry) => designIds.has(entry.id))) {
            setItemQuantity(item, 0);
          }
        } else {
          setMessage(`আপনি ${bn(target)}টি বেছে নিয়েছেন। নতুনটি নিতে আগে একটি বাদ দিন বা সংখ্যা বাড়ান।`);
          return;
        }
      }
      if (setItemQuantity(toCartProduct(design), 1) === "full") {
        setMessage(`একটি অর্ডারে সর্বোচ্চ ${bn(MAX_ITEMS)}টি ভিন্ন পণ্য রাখা যায়।`);
      }
    });
  }

  // Pieces of the design in the main image; the "how many" total follows along
  const activeQty = quantityOf.get(active.id) ?? 0;
  function changeActiveQty(next) {
    const quantity = Math.max(1, Math.min(MAX_QTY, next));
    run(() => {
      setItemQuantity(active, quantity);
      setChosenTarget(Math.min(MAX_PIECES, selectedPieces - activeQty + quantity));
      setMessage("");
    });
  }

  // Opens the same checkout popup as other products, for everything in the cart
  function openCheckout() {
    setCheckoutLoaded(true);
    setCheckoutItems(
      // Read the cart fresh: the same-design popup may have just changed quantities
      readCart().map(({ id, name, image, price, quantity, hijab }) => ({
        id,
        name,
        image,
        price,
        quantity,
        eligible: hijab,
      }))
    );
  }

  // Asks first when this browser placed an order in the last 60 minutes
  const [requestCheckout, duplicatePopup] = useDuplicateGate(openCheckout);
  // Same design more than once? Show every piece and the price before checkout
  const [checkSameDesign, sameDesignPopup] = useSameDesignCheck({
    onProceed: requestCheckout,
    onKeepOne: (ids) =>
      run(() => {
        for (const id of ids) setQuantity(id, 1);
        setChosenTarget(null); // "how many" follows the new total
      }),
    onSetQuantity: (id, quantity) =>
      run(() => {
        setQuantity(id, quantity);
        setChosenTarget(null); // "how many" follows the new total
      }),
    onOtherDesigns: (ids) =>
      run(() => {
        for (const id of ids) setQuantity(id, 1);
        setChosenTarget(target); // keep the total, so the freed pieces can go to other designs
        setShowAll(true);
        document.getElementById("pick-count")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }),
  });

  const remaining = target - selectedPieces;
  const ready = items !== null && selectedPieces > 0 && remaining === 0;
  const phoneHref = hasValue(SITE.phone) ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}` : null;
  const whatsappDigits = hasValue(SITE.whatsapp) ? SITE.whatsapp.replace(/\D/g, "") : "";

  const optionClass = (isActive) =>
    `relative rounded-lg border-2 px-2 py-2 text-base font-semibold transition ${
      isActive ? "border-[#b8860b] bg-[#b8860b] text-white" : "border-[#d4a017] bg-white text-neutral-800 hover:bg-amber-50"
    }`;

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      {/* Main image */}
      <div className="md:sticky md:top-20 md:self-start">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-sm">
          {/* LCP image: fetched early without preload/priority; key resets the fade per design */}
          <FadeImage
            key={active.id}
            design={active}
            width={560}
            height={747}
            sizes="(min-width: 768px) 560px, 100vw"
            loading="eager"
            fetchPriority="high"
            numberClass="text-6xl"
          />
          {active.image ? (
            <button
              type="button"
              data-track="collection-zoom"
              onClick={() => setZoomed(active)}
              aria-label="ছবি বড় করে দেখুন"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          ) : null}
          <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white">
            {label(active)}
          </span>
        </div>
      </div>

      {/* Details and picker */}
      <div>
        <p className="text-sm font-semibold" style={{ color: GOLD }}>রেডি হিজাব</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">{title}</h1>
        {price ? (
          <p className="mt-3 text-2xl font-bold" style={{ color: GOLD }}>
            মূল্যঃ {price.toFixed(2)}৳
          </p>
        ) : null}

        <p className="mt-5 font-semibold text-neutral-800">আপনার পছন্দের ডিজাইন বেছে নিন:</p>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 px-4 py-3">
          <span aria-hidden="true" className="text-2xl">🏷️</span>
          <p className="flex-1 text-sm font-semibold text-neutral-900">
            ৩টি বা তার বেশি নিলে
            <span className="block text-base font-bold">স্পেশাল অফার!</span>
          </p>
          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-xs font-bold leading-tight text-white shadow">
            ১০%
            <span>ছাড়</span>
          </span>
        </div>

        {/* Quick picks; any other count is set with the stepper below */}
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="কয়টি নেবেন">
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              data-track={`collection-pick-${count}`}
              onClick={() => chooseTarget(count)}
              aria-pressed={target === count}
              className={optionClass(target === count)}
            >
              {bn(count)}টি নেব
              {count === DISCOUNT_MIN_QTY ? (
                <span className="absolute -right-1 -top-2.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ১০% ছাড়
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="pick-count" className="text-sm font-medium text-neutral-800">
            কয়টি নেবেন?
          </label>
          <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white">
            <button type="button" aria-label="সংখ্যা কমান" disabled={target <= 1} onClick={() => chooseTarget(target - 1)} className="h-9 w-9 rounded-full text-lg disabled:opacity-30">
              −
            </button>
            <input
              id="pick-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxTarget}
              value={target}
              onChange={(event) => chooseTarget(Number(event.target.value) || 1)}
              className="w-12 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" aria-label="সংখ্যা বাড়ান" disabled={target >= maxTarget} onClick={() => chooseTarget(target + 1)} className="h-9 w-9 rounded-full text-lg disabled:opacity-30">
              +
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-neutral-700" aria-live="polite">
          {items === null
            ? "লোড হচ্ছে…"
            : remaining > 0
              ? `${bn(target)}টির মধ্যে ${bn(selectedPieces)}টি বাছাই হয়েছে — আরও ${bn(remaining)}টি বেছে নিন।`
              : remaining < 0
                ? `আপনি ${bn(selectedPieces)}টি বেছে নিয়েছেন — ${bn(-remaining)}টি বাদ দিন বা সংখ্যা বাড়ান।`
                : `✓ ${bn(selectedPieces)}টি বাছাই হয়েছে।`}
        </p>
        {message ? (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        ) : null}

        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {visible.map((design, index) => {
            const isSelected = selectedIds.has(design.id);
            return (
              <li key={design.id}>
                <button
                  type="button"
                  data-track="collection-design"
                  onClick={() => toggle(design)}
                  aria-pressed={isSelected}
                  aria-label={`ডিজাইন ${label(design)}${isSelected ? " — বাছাই করা" : ""}`}
                  className={`relative block aspect-[3/4] w-full overflow-hidden rounded-lg border-2 transition ${
                    isSelected ? "border-[#b8860b] ring-2 ring-[#b8860b]/40" : "border-transparent hover:border-neutral-400"
                  }`}
                >
                  <FadeImage
                    design={design}
                    width={210}
                    height={280}
                    sizes="(min-width: 768px) 105px, 23vw"
                    quality={70}
                    loading={index < EAGER_THUMBS ? "eager" : "lazy"}
                    // "low" keeps React from adding <link rel=preload> for eager thumbnails,
                    // so they don't compete with the main (LCP) image
                    fetchPriority={index < EAGER_THUMBS ? "low" : undefined}
                    numberClass="text-lg"
                  />
                  {isSelected ? (
                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b8860b] px-1 text-xs font-bold text-white">
                      {quantityOf.get(design.id) > 1 ? `×${quantityOf.get(design.id)}` : "✓"}
                    </span>
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-xs font-bold text-white">
                    {label(design)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 w-full rounded-lg border-2 border-[#d4a017] bg-white py-2 text-sm font-semibold text-neutral-800 hover:bg-amber-50"
          >
            আরও ডিজাইন দেখুন ({bn(hiddenCount)}টি বাকি) ▼
          </button>
        ) : null}

        <div className="mt-5 flex items-stretch gap-3">
          {/* Pieces of the design in the main image (only when it is selected) */}
          <div
            className="inline-flex shrink-0 items-center rounded-lg border border-neutral-300 bg-white"
            role="group"
            aria-label={`ডিজাইন ${label(active)}-এর পরিমাণ`}
          >
            <button
              type="button"
              aria-label="পরিমাণ কমান"
              disabled={activeQty <= 1}
              onClick={() => changeActiveQty(activeQty - 1)}
              className="h-full w-10 text-xl disabled:opacity-30"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold" aria-live="polite">
              {bn(activeQty)}
            </span>
            <button
              type="button"
              aria-label="পরিমাণ বাড়ান"
              disabled={activeQty === 0 || activeQty >= MAX_QTY}
              onClick={() => changeActiveQty(activeQty + 1)}
              className="h-full w-10 text-xl disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            data-track="collection-checkout"
            onClick={() => checkSameDesign(items ?? [])}
            disabled={!ready}
            className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
          >
            অর্ডার করুন
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {whatsappDigits ? (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white hover:brightness-95"
            >
              WhatsApp যোগাযোগ
            </a>
          ) : null}
          {phoneHref ? (
            <a href={phoneHref} data-track="collection-call" className="flex-1 rounded-lg bg-blue-500 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-600">
              সরাসরি কল করুন
            </a>
          ) : null}
        </div>
      </div>

      {zoomed ? <ZoomDialog design={zoomed} onClose={() => setZoomed(null)} /> : null}

      {/* Mounted (and its code downloaded) only after the first "order" click */}
      {checkoutLoaded ? (
        <CheckoutPanel
          items={checkoutItems ?? []}
          open={checkoutItems !== null}
          onClose={() => setCheckoutItems(null)}
          onSuccess={() => {
            try {
              clearCart();
            } catch {
              // Order already placed; a stale cart is harmless
            }
          }}
        />
      ) : null}
      {sameDesignPopup}
      {duplicatePopup}
    </div>
  );
}
