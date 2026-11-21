// Meta Pixel helpers for the browser. Product ids are the Supabase ids — the same `id`
// column as the Facebook catalog feed (/api/facebook-feed) — so events match catalog items.
// Only product ids, quantities and prices are sent: never names, phones or addresses.

// Waits for the Pixel base code (loaded after the page is interactive), max ~10s.
// If the Pixel is blocked (ad blocker) the event is simply skipped.
export function pixelTrack(event, params) {
  if (typeof window === "undefined") return;
  let tries = 0;
  const send = () => {
    if (typeof window.fbq === "function") {
      window.fbq("track", event, params);
    } else if (++tries < 40) {
      setTimeout(send, 250);
    }
  };
  send();
}

// items: [{ id, quantity, price }]
export function productParams(items) {
  const list = items.filter((i) => i && i.id != null);
  return {
    content_type: "product",
    content_ids: list.map((i) => String(i.id)),
    contents: list.map((i) => ({ id: String(i.id), quantity: Number(i.quantity) || 1, item_price: Number(i.price) || 0 })),
    num_items: list.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    value: list.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
    currency: "BDT",
  };
}
