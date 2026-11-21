"use client";

import { useEffect, useRef } from "react";
import { pixelTrack, productParams } from "@/lib/pixel";

// Meta Pixel ViewContent, once per page view.
// items: [{ id, price }] — one product, or the designs shown on a collection page.
export default function PixelViewContent({ items, name }) {
  const key = items.map((i) => i.id).join(",");
  const sent = useRef("");

  useEffect(() => {
    if (!key || sent.current === key) return;
    sent.current = key;
    const params = productParams(items.map((i) => ({ ...i, quantity: 1 })));
    // ViewContent value = the price of one item, not the sum of every design on the page
    params.value = Number(items[0]?.price) || 0;
    delete params.num_items;
    pixelTrack("ViewContent", { ...params, content_name: name });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once per distinct product list
  }, [key]);

  return null;
}
