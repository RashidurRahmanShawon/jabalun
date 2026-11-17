"use client";

import { useEffect } from "react";

// Sends the Meta Pixel "Purchase" event from the thank-you page. That page only shows an
// order when its id and secret key match, so this runs only after a real, successful order.
// Each order is sent once per browser: reloading the thank-you page does not count it again.
// purchase: { number, value, items: [{ id, quantity, price }] } — no name, phone or address.
const SENT_KEY = "jabalun_pixel_purchases";

function alreadySent(number) {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "[]").includes(number);
  } catch {
    return false;
  }
}

function markSent(number) {
  try {
    const list = JSON.parse(localStorage.getItem(SENT_KEY) || "[]");
    localStorage.setItem(SENT_KEY, JSON.stringify([...list, number].slice(-50)));
  } catch {
    // storage blocked (private mode): the event is still sent once for this page view
  }
}

export default function PixelPurchase({ purchase }) {
  useEffect(() => {
    const number = String(purchase.number);
    if (alreadySent(number)) return;

    let tries = 0;
    let timer;
    const send = () => {
      // The Pixel base code loads after the page becomes interactive; wait for it (max ~10s).
      if (typeof window.fbq !== "function") {
        if (++tries < 40) timer = setTimeout(send, 250);
        return; // pixel not configured or blocked by an ad blocker
      }
      window.fbq(
        "track",
        "Purchase",
        {
          value: purchase.value,
          currency: "BDT",
          content_type: "product",
          content_ids: purchase.items.map((i) => String(i.id)),
          contents: purchase.items.map((i) => ({ id: String(i.id), quantity: i.quantity, item_price: i.price })),
          num_items: purchase.items.reduce((sum, i) => sum + i.quantity, 0),
          order_id: number,
        },
        // Same id can be reused by a server-side (Conversions API) event later, so Meta counts it once
        { eventID: `order-${number}` }
      );
      markSent(number);
    };
    send();
    return () => clearTimeout(timer);
  }, [purchase]);

  return null;
}
